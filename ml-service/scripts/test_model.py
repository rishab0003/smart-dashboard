"""
Test that the saved model loads and predicts correctly
"""

import joblib
import json
import numpy as np
import os


def load_model():
    """Load the saved model and metadata"""

    print("\n[1] 📂 Loading Saved Model Files")

    # Get the base directory
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    models_dir = os.path.join(BASE_DIR, 'models')

    # 1️⃣ Load model
    model_path = os.path.join(models_dir, 'sales_model.pkl')
    model = joblib.load(model_path)

    # 2️⃣ Load metadata
    metadata_path = os.path.join(models_dir, 'model_metadata.json')
    with open(metadata_path) as f:
        metadata = json.load(f)

    # Get features from metadata
    features = metadata.get('features', [])

    print("\n[2] ✅ Model Loaded Successfully")
    print("------------------------------------")
    print(f"   Model Type  : {metadata.get('model_name', 'Unknown')}")
    print(f"   Features    : {len(features)}")
    print(f"   R² Score    : {metadata.get('r2', 'N/A'):.4f}")

    return model, features, metadata


def make_test_prediction(model, features):
    """Make a sample prediction to verify model works"""

    print("\n[3] 🔬 Running Test Prediction")

    # Sample realistic input
    sample = {
        'month': 12,
        'year': 2024,
        'quarter': 4,
        'day_of_week': 2,
        'is_weekend': 0,
        'is_quarter_end': 1,
        'season': 1,
        'month_sin': -0.5,
        'month_cos': 0.866,
        'quantityordered': 45,
        'priceeach': 120.0,
        'msrp': 150.0,
        'productline_encoded': 1,
        'territory_encoded': 2,
    }

    print("\n   Input Features:")
    for i, (key, value) in enumerate(sample.items(), start=1):
        print(f"   [{i}] {key}: {value}")

    # Create feature vector using correct order
    feature_vector = np.array([[sample.get(f, 0) for f in features]])

    # Predict
    prediction = model.predict(feature_vector)[0]

    print("\n[4] 🔮 Prediction Result")
    print("------------------------------------")
    print("   Scenario : December | Motorcycles")
    print("   Quantity : 45")
    print("   Price    : $120")

    print(f"\n   📈 Predicted Sales : ${prediction:,.2f}")

    return prediction


if __name__ == "__main__":

    print("\n Model Verification Script")

    model, features, metadata = load_model()

    make_test_prediction(model, features)

    print("\n[5] ✅ Test Completed Successfully")