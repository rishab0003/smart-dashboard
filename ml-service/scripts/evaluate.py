"""
Model evaluation with cross-validation
Cross-validation = more reliable performance estimate
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import KFold, cross_val_score
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
import matplotlib.pyplot as plt
import joblib
import json


def cross_validate_model(model, X, y, cv_folds=5):
    """
    K-Fold Cross Validation

    Splits data into 5 parts:
    Train on 4 parts, test on 1
    Repeat 5 times with different test parts
    Average the scores = reliable performance estimate
    """

    print(f"\n[1] 🔄 Running {cv_folds}-Fold Cross Validation...")

    kf = KFold(n_splits=cv_folds, shuffle=True, random_state=42)

    # Negative because sklearn convention (lower = better becomes negative)
    cv_rmse = cross_val_score(model, X, y, cv=kf,
                              scoring='neg_root_mean_squared_error')

    cv_r2 = cross_val_score(model, X, y, cv=kf,
                            scoring='r2')

    cv_mae = cross_val_score(model, X, y, cv=kf,
                             scoring='neg_mean_absolute_error')

    print("\n[2] 📊 Cross-Validation Results")
    print("------------------------------------")
    print(f"   RMSE : {-cv_rmse.mean():,.2f} ± {cv_rmse.std():,.2f}")
    print(f"   R²   : {cv_r2.mean():.4f} ± {cv_r2.std():.4f}")
    print(f"   MAE  : {-cv_mae.mean():,.2f} ± {cv_mae.std():,.2f}")

    return {
        'cv_rmse_mean': float(-cv_rmse.mean()),
        'cv_rmse_std': float(cv_rmse.std()),
        'cv_r2_mean': float(cv_r2.mean()),
        'cv_r2_std': float(cv_r2.std()),
        'cv_mae_mean': float(-cv_mae.mean()),
    }


def save_model_and_metadata(model, feature_cols, metrics, model_path='../models/'):
    """Save model and all information needed to use it later"""

    import os
    os.makedirs(model_path, exist_ok=True)

    print("\n[3] 💾 Saving Model Files")

    # 1️⃣ Save trained model
    model_file = os.path.join(model_path, 'sales_model.pkl')
    joblib.dump(model, model_file)
    print(f"   [3.1] Model saved → {model_file}")

    # 2️⃣ Save feature columns
    features_file = os.path.join(model_path, 'feature_columns.json')
    with open(features_file, 'w') as f:
        json.dump(feature_cols, f, indent=2)

    print(f"   [3.2] Feature list saved → {features_file}")

    # 3️⃣ Save metadata
    import datetime

    metadata = {
        'model_type': type(model).__name__,
        'model_version': '1.0.0',
        'trained_at': datetime.datetime.now().isoformat(),
        'feature_count': len(feature_cols),
        'features': feature_cols,
        'metrics': metrics
    }

    meta_file = os.path.join(model_path, 'model_metadata.json')

    with open(meta_file, 'w') as f:
        json.dump(metadata, f, indent=2)

    print(f"   [3.3] Metadata saved → {meta_file}")

    print("\n[4] ✅ Model Saved Successfully!")
    print("------------------------------------")
    print(f"   Model Type : {metadata['model_type']}")
    print(f"   R² Score   : {metrics.get('r2', 'N/A')}")
    print(f"   RMSE       : {metrics.get('rmse', 0):,.2f}")