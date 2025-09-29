# step8_grouped_residuals.py
import os
import joblib
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import mean_absolute_error

sns.set(style="whitegrid", rc={"figure.figsize": (8,6)})
OUTDIR = "outputs_eval"
os.makedirs(OUTDIR, exist_ok=True)

# Load data and model
model = joblib.load("model_rf.pkl")
X_train, X_test, y_train, y_test = joblib.load("train_test_split.pkl")

# Convert to DataFrame if needed
if isinstance(X_train, np.ndarray):
    X_train = pd.DataFrame(X_train, columns=[f"f{i}" for i in range(X_train.shape[1])])
if isinstance(X_test, np.ndarray):
    X_test = pd.DataFrame(X_test, columns=[f"f{i}" for i in range(X_test.shape[1])])

X = pd.concat([X_train, X_test], ignore_index=True)
y = np.concatenate([np.ravel(y_train), np.ravel(y_test)])

# If you have metal_type / route info, add it here
# Example: randomly assign for demonstration (replace with your real columns)
if "metal_type" not in X.columns:
    X["metal_type"] = np.random.choice(["Aluminium", "Copper"], size=X.shape[0])
if "route" not in X.columns:
    X["route"] = np.random.choice(["primary", "recycled"], size=X.shape[0])

# Predict
y_pred = model.predict(X)
X["residual"] = y - y_pred
X["predicted"] = y_pred
X["actual"] = y

# --- Residuals by metal type ---
plt.figure()
sns.boxplot(x="metal_type", y="residual", data=X)
plt.axhline(0, color="r", linestyle="--")
plt.ylabel("Residual (Actual - Predicted)")
plt.title("Residuals by Metal Type")
plt.savefig(os.path.join(OUTDIR, "residuals_by_metal.png"), bbox_inches="tight")
plt.close()

# --- Residuals by route ---
plt.figure()
sns.boxplot(x="route", y="residual", data=X)
plt.axhline(0, color="r", linestyle="--")
plt.ylabel("Residual (Actual - Predicted)")
plt.title("Residuals by Route (Primary vs Recycled)")
plt.savefig(os.path.join(OUTDIR, "residuals_by_route.png"), bbox_inches="tight")
plt.close()

# Optional: group by both
plt.figure(figsize=(10,6))
sns.boxplot(x="metal_type", y="residual", hue="route", data=X)
plt.axhline(0, color="r", linestyle="--")
plt.ylabel("Residual (Actual - Predicted)")
plt.title("Residuals by Metal Type and Route")
plt.savefig(os.path.join(OUTDIR, "residuals_by_metal_route.png"), bbox_inches="tight")
plt.close()

print(f"Grouped residual plots saved in {OUTDIR}/")
