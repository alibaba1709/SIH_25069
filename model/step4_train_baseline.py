# step4_train_baseline.py
import joblib
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.pipeline import Pipeline

# Load preprocessor and train/test splits
preprocessor = joblib.load("preprocessor.pkl")
X_train, X_test, y_train, y_test = joblib.load("train_test_split.pkl")

# Define model
rf = RandomForestRegressor(
    n_estimators=200,   # number of trees
    max_depth=None,     # allow trees to grow fully
    random_state=42,
    n_jobs=-1
)

# Build pipeline: preprocessing + model
model = Pipeline(steps=[
    ("preprocessor", preprocessor),
    ("rf", rf)
])

# Train
print("Training Random Forest...")
model.fit(X_train, y_train)

# Predict
y_pred = model.predict(X_test)

# Metrics
mae = mean_absolute_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)

print("Results:")
print("MAE:", round(mae, 4))
print("R²:", round(r2, 4))

# Save model
joblib.dump(model, "model_rf.pkl")
print("Model saved as model_rf.pkl")
