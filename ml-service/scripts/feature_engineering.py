"""
Feature Engineering Script

We create NEW columns from existing ones to help the model
find patterns that aren't obvious in the raw data.
"""

import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder
import joblib
import os


# -------------------------------
# TIME FEATURES
# -------------------------------

def create_time_features(df):
    """Extract rich time-based features from date"""
    print("\n⚙️  Creating time features...")

    # Ensure orderdate is datetime type
    df['orderdate'] = pd.to_datetime(df['orderdate'])

    # Basic time features
    df['month'] = df['orderdate'].dt.month
    df['year'] = df['orderdate'].dt.year
    df['quarter'] = df['orderdate'].dt.quarter
    df['day_of_week'] = df['orderdate'].dt.dayofweek   # 0=Mon, 6=Sun
    df['day_of_year'] = df['orderdate'].dt.dayofyear
    df['week_of_year'] = df['orderdate'].dt.isocalendar().week.astype(int)

    # Weekend flag
    df['is_weekend'] = (df['day_of_week'] >= 5).astype(int)

    # Quarter end (Mar, Jun, Sep, Dec)
    df['is_quarter_end'] = df['month'].isin([3, 6, 9, 12]).astype(int)

    # Season mapping
    df['season'] = df['month'].map({
        12: 1, 1: 1, 2: 1,   # Winter
        3: 2, 4: 2, 5: 2,    # Spring
        6: 3, 7: 3, 8: 3,    # Summer
        9: 4, 10: 4, 11: 4   # Fall
    })

    # Cyclical encoding
    df['month_sin'] = np.sin(2 * np.pi * df['month'] / 12)
    df['month_cos'] = np.cos(2 * np.pi * df['month'] / 12)

    print("  ✓ Time features created")
    return df


# -------------------------------
# BUSINESS FEATURES
# -------------------------------

def create_business_features(df):
    """Create business-logic-based features"""
    print("⚙️  Creating business features...")

    # Discount features
    if 'priceeach' in df.columns and 'quantityordered' in df.columns:
        df['full_price_revenue'] = df['priceeach'] * df['quantityordered']
        df['discount_amount'] = df['full_price_revenue'] - df['sales']
        df['discount_pct'] = (
            df['discount_amount'] / df['full_price_revenue'] * 100
        ).clip(0, 100)

    # Price tier
    if 'priceeach' in df.columns:
        df['price_tier'] = pd.cut(
            df['priceeach'],
            bins=[0, 50, 100, 150, float('inf')],
            labels=['budget', 'mid', 'premium', 'luxury']
        )

    # Volume tier
    if 'quantityordered' in df.columns:
        df['volume_tier'] = pd.cut(
            df['quantityordered'],
            bins=[0, 20, 40, 60, float('inf')],
            labels=['small', 'medium', 'large', 'bulk']
        )

    print("  ✓ Business features created")
    return df


# -------------------------------
# ENCODING
# -------------------------------

def encode_categorical(df, categorical_cols, save_path='../models/'):
    """Convert text categories to numbers using Label Encoding"""
    print("⚙️  Encoding categorical variables...")

    encoders = {}

    for col in categorical_cols:
        if col in df.columns:
            le = LabelEncoder()
            df[f'{col}_encoded'] = le.fit_transform(df[col].astype(str))
            encoders[col] = le
            print(
                f"  ✓ Encoded '{col}': "
                f"{dict(zip(le.classes_, le.transform(le.classes_)))}"
            )

    # Save encoders
    os.makedirs(save_path, exist_ok=True)
    joblib.dump(encoders, os.path.join(save_path, 'label_encoders.pkl'))
    print(f"  ✓ Saved label encoders to {save_path}")

    return df, encoders


# -------------------------------
# FEATURE SELECTION
# -------------------------------

def select_features(df):
    """Select final features for model training"""

    feature_cols = [
        # Time features
        'month', 'year', 'quarter', 'day_of_week',
        'is_weekend', 'is_quarter_end',
        'season', 'month_sin', 'month_cos',

        # Numeric product features
        'quantityordered', 'priceeach', 'msrp',

        # Encoded categorical
        'productline_encoded',
        'status_encoded',
        'territory_encoded',

        # Business features
        'discount_pct',
        'full_price_revenue'
    ]

    available_features = [c for c in feature_cols if c in df.columns]
    target_col = 'sales'

    print(f"\n📊 Selected {len(available_features)} features for training")
    print("   Features:", available_features)

    X = df[available_features]
    y = df[target_col]

    return X, y, available_features


# -------------------------------
# MAIN PIPELINE
# -------------------------------

if __name__ == "__main__":

    # Load cleaned data
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_path = os.path.join(BASE_DIR, 'data', 'sales_cleaned.csv')

    df = pd.read_csv(data_path)
    print(f"Loaded {len(df)} rows")

    # Feature engineering
    df = create_time_features(df)
    df = create_business_features(df)

    # Encode categorical columns
    cat_cols = ['productline', 'status', 'territory', 'dealsize']
    df, encoders = encode_categorical(df, cat_cols)

    # Save final dataset
    output_path = os.path.join(BASE_DIR, 'data', 'sales_features.csv')
    df.to_csv(output_path, index=False)

    # Select model features
    X, y, features = select_features(df)

    print("\nFeature engineering complete!")
    print(f"   X shape: {X.shape}")
    print(f"   y shape: {y.shape}")