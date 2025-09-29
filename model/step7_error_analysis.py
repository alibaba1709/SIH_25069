# step7_error_analysis.py
import os
import joblib
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import mean_absolute_error, r2_score

sns.set(style="whitegrid", rc={"figure.figsize": (7,5)})

OUTDIR = "outputs_eval"
os.makedirs(OUTDIR, exist_ok=True)

# Load data and model
model = joblib.load("model_rf.pkl")
X_train, X_test, y_train, y_test = joblib.load("train_test_split.pkl")

# Combine full dataset
X = pd.concat([pd.DataFrame(X_train), pd.DataFrame(X_test)], ignore_index=True)
y = np.concatenate([np.ravel(y_train), np.ravel(y_test)])

# Predict
y_pred = model.predict(X)
residuals = y - y_pred

print(f"Overall MAE: {mean_absolute_error(y, y_pred):.6f}, R²: {r2_score(y, y_pred):.6f}")

# --- Plot 1: Predicted vs Residuals ---
plt.figure()
sns.scatterplot(x=y_pred, y=residuals, alpha=0.5)
plt.axhline(0, color='r', linestyle='--')
plt.xlabel("Predicted MCI")
plt.ylabel("Residual (Actual - Predicted)")
plt.title("Residuals vs Predicted")
plt.savefig(os.path.join(OUTDIR, "residuals_vs_predicted.png"), bbox_inches="tight")
plt.close()

# --- Plot 2: Histogram of residuals ---
plt.figure()
sns.histplot(residuals, bins=40, kde=True)
plt.xlabel("Residual (Actual - Predicted)")
plt.title("Residual Distribution")
plt.savefig(os.path.join(OUTDIR, "residuals_hist.png"), bbox_inches="tight")
plt.close()

print(f"Residual plots saved in {OUTDIR}/")
