# ml-service/scripts/train.py

"""
Machine Learning Model Training Script

We use a regression approach because our target (SALES) is a continuous number.

Models we'll try:
1. Linear Regression   — simple baseline
2. Random Forest       — ensemble of decision trees
3. XGBoost             — gradient boosting (usually best)
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import xgboost as xgb
import joblib
import json
import os
import sys

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# --------------------------------------------------
# LOAD & SPLIT DATA
# --------------------------------------------------

def load_and_prepare_data():
    print("📥 Loading data...")
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_path = os.path.join(BASE_DIR, "data", "sales_features.csv")
    df = pd.read_csv(data_path)
    print(f"   Total rows: {len(df)}")

    feature_cols = [
        'month', 'year', 'quarter', 'day_of_week', 'is_weekend',
        'is_quarter_end', 'season', 'month_sin', 'month_cos',
        'quantityordered', 'priceeach', 'msrp',
        'productline_encoded', 'territory_encoded',
    ]

    feature_cols = [f for f in feature_cols if f in df.columns]

    X = df[feature_cols].fillna(0)
    y = df['sales']

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    print(f"   Training set: {len(X_train)} rows")
    print(f"   Testing set:  {len(X_test)} rows")
    print(f"   Features: {feature_cols}")

    return X_train, X_test, y_train, y_test, feature_cols


# --------------------------------------------------
# EVALUATION
# --------------------------------------------------

def evaluate_model(model, X_test, y_test, model_name):
    y_pred = model.predict(X_test)

    mae  = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2   = r2_score(y_test, y_pred)

    print(f"\n📊 {model_name} Performance:")
    print(f"   MAE:  {mae:,.2f}")
    print(f"   RMSE: {rmse:,.2f}")
    print(f"   R²:   {r2:.4f}")

    return {
        'model': model_name,
        'mae': mae,
        'rmse': rmse,
        'r2': r2,
        'predictions': y_pred
    }


# --------------------------------------------------
# MODELS
# --------------------------------------------------

def train_linear_regression(X_train, y_train):
    print("\n🔧 Training Linear Regression...")
    model = LinearRegression()
    model.fit(X_train, y_train)
    return model


def train_random_forest(X_train, y_train):
    print("\n🌳 Training Random Forest...")
    model = RandomForestRegressor(
        n_estimators=50,
        max_depth=10,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=1
    )
    model.fit(X_train, y_train)
    return model


def train_xgboost(X_train, y_train):
    print("\n🚀 Training XGBoost...")

    model = xgb.XGBRegressor(
        n_estimators=100,
        max_depth=6,
        learning_rate=0.1,
        subsample=0.9,
        colsample_bytree=0.9,
        min_child_weight=1,
        reg_alpha=0.05,
        reg_lambda=0.5,
        random_state=42,
        tree_method='hist',
        eval_metric='rmse',
        verbosity=1
    )

    model.fit(X_train, y_train)
    return model


# --------------------------------------------------
# VISUALIZATION
# --------------------------------------------------

def plot_feature_importance(model, feature_cols):
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    save_path = os.path.join(BASE_DIR, "data")

    os.makedirs(save_path, exist_ok=True)

    if hasattr(model, 'feature_importances_'):
        importance_df = pd.DataFrame({
            'feature': feature_cols,
            'importance': model.feature_importances_
        }).sort_values('importance', ascending=True)

        plt.figure(figsize=(10, 6))
        plt.barh(importance_df['feature'], importance_df['importance'])
        plt.title('Feature Importance')
        plt.tight_layout()
        plt.savefig(os.path.join(save_path, 'feature_importance.png'))
        plt.close()

        print("\n📊 Feature importance chart saved!")


def plot_predictions_vs_actual(y_test, y_pred, model_name):
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    save_path = os.path.join(BASE_DIR, "data")

    os.makedirs(save_path, exist_ok=True)

    plt.figure(figsize=(8, 8))
    plt.scatter(y_test, y_pred, alpha=0.4)
    plt.plot(
        [y_test.min(), y_test.max()],
        [y_test.min(), y_test.max()],
        'r--'
    )
    plt.xlabel('Actual Sales')
    plt.ylabel('Predicted Sales')
    plt.title(f'{model_name}: Predicted vs Actual')
    plt.tight_layout()
    plt.savefig(os.path.join(save_path, f'{model_name.lower()}_predictions.png'))
    plt.close()

    print(f"   Prediction chart saved for {model_name}")


# --------------------------------------------------
# MAIN PIPELINE
# --------------------------------------------------

if __name__ == "__main__":

    # 1️⃣ Load Data
    X_train, X_test, y_train, y_test, feature_cols = load_and_prepare_data()

    models = {}
    results = []

    # 2️⃣ Train Models
    lr = train_linear_regression(X_train, y_train)
    models['linear'] = lr
    results.append(evaluate_model(lr, X_test, y_test, 'Linear Regression'))

    rf = train_random_forest(X_train, y_train)
    models['random_forest'] = rf
    results.append(evaluate_model(rf, X_test, y_test, 'Random Forest'))

    xgb_model = train_xgboost(X_train, y_train)
    models['xgboost'] = xgb_model
    xgb_result = evaluate_model(xgb_model, X_test, y_test, 'XGBoost')
    results.append(xgb_result)

    # 3️⃣ Compare
    print("\n" + "="*60)
    print("📊 MODEL COMPARISON SUMMARY")
    print("="*60)
    results_df = pd.DataFrame(results)[['model', 'mae', 'rmse', 'r2']]
    print(results_df.to_string(index=False))

    best_result = min(results, key=lambda x: x['rmse'])
    best_model = models[{
        'Linear Regression': 'linear',
        'Random Forest': 'random_forest',
        'XGBoost': 'xgboost'
    }[best_result['model']]]

    print(f"\n🏆 Best model: {best_result['model']} (RMSE: {best_result['rmse']:,.2f})")

    # 4️⃣ Visualize
    plot_feature_importance(best_model, feature_cols)
    plot_predictions_vs_actual(y_test, best_result['predictions'], best_result['model'])

    # 5️⃣ Save the best model
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    models_dir = os.path.join(BASE_DIR, 'models')
    os.makedirs(models_dir, exist_ok=True)

    # Save the best model
    model_path = os.path.join(models_dir, 'sales_model.pkl')
    joblib.dump(best_model, model_path)
    print(f"\n💾 Model saved to: {model_path}")

    # Save feature columns
    feature_path = os.path.join(models_dir, 'feature_columns.json')
    with open(feature_path, 'w') as f:
        json.dump(feature_cols, f, indent=2)
    print(f"📄 Feature columns saved to: {feature_path}")

    # Save metadata
    metadata = {
        'model_type': best_result['model'],
        'model_version': '1.0.0',
        'features': feature_cols,
        'mae': best_result['mae'],
        'rmse': best_result['rmse'],
        'r2': best_result['r2']
    }
    metadata_path = os.path.join(models_dir, 'model_metadata.json')
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    print(f"📝 Metadata saved to: {metadata_path}")

    print("\n✅ Training complete! Model saved successfully.")

    #     # --------------------------------------------------
    # # SAVE MODEL
    # # --------------------------------------------------

    # BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    # models_dir = os.path.join(BASE_DIR, 'models')
    # os.makedirs(models_dir, exist_ok=True)

    # # Save model
    # model_path = os.path.join(models_dir, 'sales_model.pkl')
    # joblib.dump(best_model, model_path)
    # print(f"\n💾 Model saved to: {model_path}")

    # # Save feature columns
    # feature_path = os.path.join(models_dir, 'feature_columns.json')

    # with open(feature_path, 'w') as f:
    #     json.dump(feature_cols, f, indent=2)

    # print(f"📄 Feature columns saved to: {feature_path}")

    # # Save metadata
    # metadata = {
    #     'model_name': best_result['model'],
    #     'model_version': '1.0.0',
    #     'features': feature_cols,
    #     'mae': best_result['mae'],
    #     'rmse': best_result['rmse'],
    #     'r2': best_result['r2']
    # }

    # metadata_path = os.path.join(models_dir, 'model_metadata.json')

    # with open(metadata_path, 'w') as f:
    #     json.dump(metadata, f, indent=2)

    # print(f"📝 Metadata saved to: {metadata_path}")

    # print("\n✅ Training complete! Model saved successfully.")