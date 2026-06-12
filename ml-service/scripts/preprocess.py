"""
Data Cleaning & Preprocessing Script
"""
import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder, StandardScaler
import joblib
import os
import sys


# --------------------------------------------------
# LOAD DATA
# --------------------------------------------------
def load_data(filepath):
    """Load CSV with fallback encodings"""
    for enc in ("utf-8", "latin-1"):
        try:
            df = pd.read_csv(filepath, encoding=enc)
            print(f"✅ Loaded {len(df)} rows, {len(df.columns)} columns (encoding={enc})")
            return df
        except Exception:
            continue
    raise IOError(f"Could not read file: {filepath}")


# --------------------------------------------------
# CLEAN DATA
# --------------------------------------------------
def clean_data(df):
    """Remove bad data, fix formats, handle missing values"""
    print("\n🧹 Starting data cleaning...")
    original_size = len(df)

    # 1. STANDARDIZE COLUMN NAMES
    df.columns = df.columns.str.lower().str.replace(" ", "_", regex=False).str.strip()
    print("  ✓ Standardized column names")

    # 2. PARSE DATES (if present)
    if "orderdate" in df.columns:
        df["orderdate"] = pd.to_datetime(df["orderdate"], errors="coerce")
        df["order_year"] = df["orderdate"].dt.year
        df["order_month"] = df["orderdate"].dt.month
        df["order_quarter"] = df["orderdate"].dt.quarter
        df["order_dayofweek"] = df["orderdate"].dt.dayofweek
        df["order_dayofyear"] = df["orderdate"].dt.dayofyear
        print("  ✓ Parsed dates and extracted date features")
    else:
        print("  ⚠️ 'orderdate' column not found — skipping date parsing")

    # 2.5 Convert known numeric-like columns to numeric
    numeric_like = ["priceeach", "quantityordered", "sales", "quantity_ordered", "price_each"]
    for col in numeric_like:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    # 3. HANDLE MISSING VALUES (report)
    for col in df.columns:
        pct = df[col].isnull().mean() * 100
        if pct > 0:
            print(f"  ⚠️ Column '{col}' has {pct:.1f}% missing values")

    # Numeric columns → fill with median
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    for col in numeric_cols:
        if df[col].isnull().any():
            median_val = df[col].median()
            df[col].fillna(median_val, inplace=True)
            print(f"  ✓ Filled '{col}' with median ({median_val:.2f})")

    # Text columns → fill with UNKNOWN
    text_cols = df.select_dtypes(include=["object"]).columns
    for col in text_cols:
        if df[col].isnull().any():
            df[col].fillna("UNKNOWN", inplace=True)
            print(f"  ✓ Filled '{col}' with UNKNOWN")

    # 4. REMOVE CANCELLED ORDERS
    if "status" in df.columns:
        df = df[df["status"].str.upper() != "CANCELLED"].copy()
        print("  ✓ Removed cancelled orders")

    # 5. HANDLE OUTLIERS (IQR METHOD) for sales
    if "sales" in df.columns:
        Q1 = df["sales"].quantile(0.25)
        Q3 = df["sales"].quantile(0.75)
        IQR = Q3 - Q1 if pd.notna(Q1) and pd.notna(Q3) else 0

        lower_bound = Q1 - 3 * IQR
        upper_bound = Q3 + 3 * IQR

        outliers = df[(df["sales"] < lower_bound) | (df["sales"] > upper_bound)]
        print(f"  ⚠️ Found {len(outliers)} outliers in sales")

        # Cap outliers
        df["sales"] = df["sales"].clip(lower_bound, upper_bound)
        df["is_outlier"] = (
            (df["sales"] <= lower_bound) | (df["sales"] >= upper_bound)
        ).astype(int)

    # 6. CLEAN TEXT COLUMNS
    for col in text_cols:
        # ensure string operations are safe
        df[col] = df[col].astype(str).str.strip().str.upper()

    # 7. CALCULATE REVENUE & DISCOUNT
    if "priceeach" in df.columns and "quantityordered" in df.columns:
        df["revenue"] = df["quantityordered"] * df["priceeach"]
        # avoid division by zero
        df["discount_pct"] = np.where(
            df["revenue"] == 0,
            0.0,
            ((df["revenue"] - df["sales"]) / df["revenue"] * 100)
        )
        df["discount_pct"] = df["discount_pct"].clip(0, 100)

    cleaned_size = len(df)
    removed = original_size - cleaned_size

    print("\n✅ Cleaning complete!")
    print(f"   Original: {original_size} rows")
    print(f"   Removed:  {removed} rows")
    print(f"   Final:    {cleaned_size} rows")

    return df


def save_clean_data(df, output_path):
    """Save cleaned data to CSV"""
    out_dir = os.path.dirname(output_path) or "."
    os.makedirs(out_dir, exist_ok=True)
    df.to_csv(output_path, index=False)
    print(f"\n💾 Saved cleaned data to: {output_path}")
    return df


# --------------------------------------------------
# MAIN PIPELINE
# --------------------------------------------------
if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.abspath(__file__))
    raw_path = os.path.abspath(os.path.join(base_dir, "..", "data", "sales_data_sample.csv"))
    out_path = os.path.abspath(os.path.join(base_dir, "..", "data", "sales_cleaned.csv"))

    try:
        raw_df = load_data(raw_path)
        clean_df = clean_data(raw_df)
        save_clean_data(clean_df, out_path)
    except Exception as e:
        print(f"❌ Pipeline failed: {e}", file=sys.stderr)
        sys.exit(1)