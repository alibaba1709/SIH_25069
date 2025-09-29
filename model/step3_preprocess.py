# step3_preprocess.py
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
import numpy as np
import joblib

DATA = "LCA_multi_metal_with_MCI.csv"

# Load
df = pd.read_csv(DATA)

# Target variable
y = df["MCI"]

# Features: drop columns that leak info or not useful
drop_cols = [
    "MCI", "MCI_percent", "MCI_raw", "circularity_index_default",
    "missing_data_flag", "LFI", "F", "W_kg", "V_kg", "recovered_kg", "lifespan_clipped"
]
X = df.drop(columns=[c for c in drop_cols if c in df.columns])

# Identify categorical vs numerical
categorical_cols = X.select_dtypes(include=["object"]).columns.tolist()
numerical_cols = X.select_dtypes(include=[np.number]).columns.tolist()

print("Categorical:", categorical_cols)
print("Numerical (first 10):", numerical_cols[:10])

# Preprocessing
numeric_transformer = Pipeline(steps=[
    ("scaler", StandardScaler())
])
categorical_transformer = OneHotEncoder(handle_unknown="ignore")

preprocessor = ColumnTransformer(
    transformers=[
        ("num", numeric_transformer, numerical_cols),
        ("cat", categorical_transformer, categorical_cols)
    ]
)

# Split train/test
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

print("Shapes:")
print("X_train:", X_train.shape, "X_test:", X_test.shape)

# Save splits and preprocessing pipeline
joblib.dump((X_train, X_test, y_train, y_test), "train_test_split.pkl")
joblib.dump(preprocessor, "preprocessor.pkl")

print("Preprocessing pipeline saved as preprocessor.pkl")
print("Train/test splits saved as train_test_split.pkl")
