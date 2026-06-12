"""
Flask ML Microservice

This is a REST API server that:
1. Loads our trained ML model on startup
2. Exposes endpoints for making predictions
3. Provides health check and model info endpoints
4. Handles errors gracefully
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import json
import numpy as np
import os
import logging
import time
from datetime import datetime

# ── SETUP ──────────────────────────────────────────────────
app = Flask(__name__)
CORS(app)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)

logger = logging.getLogger(__name__)

# ── LOAD MODEL ON STARTUP ────────────────────────────────────
MODEL_DIR = os.environ.get('MODEL_DIR', './models')


def load_model():
    """Load model, features, and metadata"""
    try:
        model = joblib.load(os.path.join(MODEL_DIR, 'sales_model.pkl'))

        with open(os.path.join(MODEL_DIR, 'feature_columns.json')) as f:
            features = json.load(f)

        with open(os.path.join(MODEL_DIR, 'model_metadata.json')) as f:
            metadata = json.load(f)

        encoder_path = os.path.join(MODEL_DIR, 'label_encoders.pkl')
        encoders = joblib.load(encoder_path) if os.path.exists(encoder_path) else {}

        logger.info(f"✅ Model loaded: {metadata['model_type']} v{metadata['model_version']}")

        return model, features, metadata, encoders

    except FileNotFoundError as e:
        logger.error(f"❌ Model file not found: {e}")
        logger.error("Run the training script first: python scripts/train.py")
        return None, [], {}, {}


model, feature_cols, model_metadata, encoders = load_model()


def get_user_model(user_id):
    """Load user-specific model and encoders if they exist, else return defaults"""
    if not user_id:
        return model, feature_cols, model_metadata, encoders

    user_model_path = os.path.join(MODEL_DIR, f'model_{user_id}.pkl')
    user_encoder_path = os.path.join(MODEL_DIR, f'encoders_{user_id}.pkl')
    user_metadata_path = os.path.join(MODEL_DIR, f'metadata_{user_id}.json')

    if os.path.exists(user_model_path) and os.path.exists(user_encoder_path):
        try:
            u_model = joblib.load(user_model_path)
            u_encoders = joblib.load(user_encoder_path)

            # Load metadata if exists
            u_metadata = {}
            if os.path.exists(user_metadata_path):
                with open(user_metadata_path) as f:
                    u_metadata = json.load(f)

            return u_model, feature_cols, u_metadata, u_encoders
        except Exception as e:
            logger.error(f"Error loading model for user {user_id}: {e}")

    return model, feature_cols, model_metadata, encoders


# ── HELPER FUNCTIONS ────────────────────────────────────────


def encode_value(encoders, col, value):
    """Encode categorical value using saved encoder"""
    if col in encoders:
        le = encoders[col]

        if value in le.classes_:
            return int(le.transform([value])[0])

        logger.warning(f"Unknown category '{value}' for '{col}', using 0")
        return 0

    return 0


def validate_input(data):
    """Validate required fields"""
    required = ['month', 'year', 'quantityordered', 'priceeach']
    errors = []

    for field in required:
        if field not in data:
            errors.append(f"Missing required field: {field}")

        elif not isinstance(data[field], (int, float)):
            errors.append(f"Field '{field}' must be a number")

    return errors


def build_feature_vector(data, encoders):
    """Convert request data to feature vector"""

    month = int(data.get('month', 1))
    year = int(data.get('year', 2024))

    import math

    month_sin = math.sin(2 * math.pi * month / 12)
    month_cos = math.cos(2 * math.pi * month / 12)

    quarter = (month - 1) // 3 + 1
    is_quarter_end = 1 if month in [3, 6, 9, 12] else 0

    season_map = {
        12: 1, 1: 1, 2: 1,
        3: 2, 4: 2, 5: 2,
        6: 3, 7: 3, 8: 3,
        9: 4, 10: 4, 11: 4
    }

    season = season_map.get(month, 1)

    features = {
        'month': month,
        'year': year,
        'quarter': quarter,
        'day_of_week': int(data.get('day_of_week', 2)),
        'is_weekend': int(data.get('is_weekend', 0)),
        'is_quarter_end': is_quarter_end,
        'season': season,
        'month_sin': month_sin,
        'month_cos': month_cos,
        'quantityordered': float(data.get('quantityordered', 30)),
        'priceeach': float(data.get('priceeach', 100)),
        'msrp': float(data.get('msrp', data.get('priceeach', 100) * 1.3)),
        'productline_encoded': encode_value(
            encoders,
            'productline',
            data.get('productline', '').upper()
        ),
        'territory_encoded': encode_value(
            encoders,
            'territory',
            data.get('territory', 'NA').upper()
        ),
    }

    vector = [features.get(col, 0) for col in feature_cols]

    return vector

# ── API ROUTES ───────────────────────────────────────────────


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'timestamp': datetime.now().isoformat()
    }), 200


@app.route('/model-info', methods=['GET'])
def model_info():

    if not model_metadata:
        return jsonify({'error': 'No model loaded'}), 503

    return jsonify(model_metadata), 200


@app.route('/predict', methods=['POST'])
def predict():

    start_time = time.time()

    if model is None:
        return jsonify({'error': 'Model not loaded. Train the model first.'}), 503

    data = request.get_json()

    if not data:
        return jsonify({'error': 'Request body must be JSON'}), 400

    errors = validate_input(data)

    if errors:
        return jsonify({
            'error': 'Validation failed',
            'details': errors
        }), 400

    try:
        user_id = data.get('userId')
        u_model, u_features, u_metadata, u_encoders = get_user_model(user_id)

        feature_vector = build_feature_vector(data, u_encoders)

        prediction = float(u_model.predict([feature_vector])[0])

        confidence_lower = prediction * 0.85
        confidence_upper = prediction * 1.15

        elapsed = (time.time() - start_time) * 1000

        response = {
            'predicted_sales': round(prediction, 2),
            'confidence_lower': round(confidence_lower, 2),
            'confidence_upper': round(confidence_upper, 2),
            'model_version': u_metadata.get('model_version', model_metadata.get('model_version', 'unknown')),
            'response_time_ms': round(elapsed, 2)
        }

        logger.info(f"Prediction for user {user_id}: {prediction:,.2f} in {elapsed:.1f}ms")

        return jsonify(response), 200

    except Exception as e:

        logger.error(f"Prediction error: {str(e)}", exc_info=True)

        return jsonify({
            'error': 'Prediction failed',
            'details': str(e)
        }), 500


@app.route('/predict/batch', methods=['POST'])
def predict_batch():

    if model is None:
        return jsonify({'error': 'Model not loaded'}), 503

    data = request.get_json()

    if not data or 'records' not in data:
        return jsonify({'error': 'Send {"records": [...]}'}), 400

    records = data['records']

    if len(records) > 1000:
        return jsonify({'error': 'Max 1000 records per batch'}), 400

    user_id = data.get('userId')
    u_model, u_features, u_metadata, u_encoders = get_user_model(user_id)

    results = []

    for record in records:
        try:
            feature_vector = build_feature_vector(record, u_encoders)

            prediction = float(u_model.predict([feature_vector])[0])

            results.append({
                'predicted_sales': round(prediction, 2),
                'status': 'success'
            })

        except Exception as e:
            results.append({
                'status': 'error',
                'error': str(e)
            })

    return jsonify({
        'results': results,
        'count': len(results)
    }), 200


@app.route('/train', methods=['POST'])
def train_user_model():
    """Retrain a Random Forest model on user-provided data"""
    import pandas as pd
    from sklearn.ensemble import RandomForestRegressor
    from sklearn.preprocessing import LabelEncoder
    import math

    data = request.get_json()
    if not data or 'userId' not in data or 'records' not in data:
        return jsonify({'error': 'Missing userId or records'}), 400

    user_id = data['userId']
    records = data['records']

    if len(records) < 5:
        # Insufficient data, remove custom model if exists
        user_model_path = os.path.join(MODEL_DIR, f'model_{user_id}.pkl')
        user_encoder_path = os.path.join(MODEL_DIR, f'encoders_{user_id}.pkl')
        user_metadata_path = os.path.join(MODEL_DIR, f'metadata_{user_id}.json')

        for path in [user_model_path, user_encoder_path, user_metadata_path]:
            if os.path.exists(path):
                os.remove(path)

        return jsonify({
            'success': True,
            'message': 'Insufficient records to train model (< 5). Removed user-specific model.'
        }), 200

    try:
        df = pd.DataFrame(records)
        df.columns = [c.lower().strip() for c in df.columns]

        required = ['month', 'year', 'quantityordered', 'priceeach', 'productline', 'territory', 'sales']
        for col in required:
            if col not in df.columns:
                return jsonify({'error': f'Missing required column in training data: {col}'}), 400

        # Calculate time & other features
        df['quarter'] = (df['month'] - 1) // 3 + 1
        df['day_of_week'] = 2
        df['is_weekend'] = 0
        df['is_quarter_end'] = df['month'].apply(lambda m: 1 if m in [3, 6, 9, 12] else 0)

        season_map = {
            12: 1, 1: 1, 2: 1,
            3: 2, 4: 2, 5: 2,
            6: 3, 7: 3, 8: 3,
            9: 4, 10: 4, 11: 4
        }
        df['season'] = df['month'].apply(lambda m: season_map.get(m, 1))
        df['month_sin'] = df['month'].apply(lambda m: math.sin(2 * math.pi * m / 12))
        df['month_cos'] = df['month'].apply(lambda m: math.cos(2 * math.pi * m / 12))
        df['msrp'] = df['priceeach'] * 1.3

        # Categorical Encoders
        user_encoders = {}
        categorical_cols = ['productline', 'territory']

        for col in categorical_cols:
            le = LabelEncoder()
            df[col] = df[col].astype(str).str.upper()
            le.fit(df[col])
            user_encoders[col] = le
            df[f'{col}_encoded'] = le.transform(df[col])

        # Feature matrix & target
        X = df[feature_cols].fillna(0)
        y = df['sales']

        # Train a simple Random Forest Regressor
        model_rf = RandomForestRegressor(
            n_estimators=30,
            max_depth=8,
            random_state=42,
            n_jobs=1
        )
        model_rf.fit(X, y)

        # Save model, encoders, and metadata
        os.makedirs(MODEL_DIR, exist_ok=True)
        joblib.dump(model_rf, os.path.join(MODEL_DIR, f'model_{user_id}.pkl'))
        joblib.dump(user_encoders, os.path.join(MODEL_DIR, f'encoders_{user_id}.pkl'))

        metadata = {
            'model_type': 'Random Forest (User Custom)',
            'model_version': '1.0.0',
            'features': feature_cols,
            'records_count': len(records),
            'trained_at': datetime.now().isoformat()
        }
        with open(os.path.join(MODEL_DIR, f'metadata_{user_id}.json'), 'w') as f:
            json.dump(metadata, f, indent=2)

        logger.info(f"✅ Trained and saved custom model for user {user_id} ({len(records)} records)")

        return jsonify({
            'success': True,
            'message': 'Custom model trained successfully',
            'records_count': len(records)
        }), 200

    except Exception as e:
        logger.error(f"Failed to train custom model for user {user_id}: {str(e)}", exc_info=True)
        return jsonify({
            'error': 'Training failed',
            'details': str(e)
        }), 500


if __name__ == '__main__':
    app.run(
        host='0.0.0.0',
        port=5001,
        debug=False
    )