# step9_shap_analysis.py
import os
import joblib
import pandas as pd
import numpy as np
import shap
import matplotlib.pyplot as plt
import seaborn as sns

sns.set(style="whitegrid")
OUTDIR = "outputs_eval"
os.makedirs(OUTDIR, exist_ok=True)

# Load model and data
model = joblib.load("model_rf.pkl")
X_train, X_test, y_train, y_test = joblib.load("train_test_split.pkl")

# Convert to DataFrame if needed
if isinstance(X_train, np.ndarray):
    X_train = pd.DataFrame(X_train, columns=[f"f{i}" for i in range(X_train.shape[1])])
if isinstance(X_test, np.ndarray):
    X_test = pd.DataFrame(X_test, columns=[f"f{i}" for i in range(X_test.shape[1])])

X = pd.concat([X_train, X_test], ignore_index=True)

# For tree-based models inside pipeline, we need to extract the fitted estimator
rf = None
preprocessor = None
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer

if isinstance(model, Pipeline):
    for name, step in model.named_steps.items():
        if hasattr(step, "feature_importances_"):
            rf = step
        if isinstance(step, ColumnTransformer):
            preprocessor = step
    if rf is None:
        rf = list(model.named_steps.values())[-1]  # fallback
else:
    rf = model

# Transform data through pipeline up to estimator
if preprocessor is not None:
    X_transformed = preprocessor.transform(X)
else:
    X_transformed = X.values

# SHAP explainer
explainer = shap.TreeExplainer(rf)
shap_values = explainer.shap_values(X_transformed)

# Feature names
if preprocessor is not None:
    try:
        feature_names = preprocessor.get_feature_names_out()
    except:
        feature_names = [f"f{i}" for i in range(X_transformed.shape[1])]
else:
    feature_names = X.columns

# --- Global feature importance ---
shap_abs_mean = np.abs(shap_values).mean(axis=0)
feat_imp = pd.DataFrame({"feature": feature_names, "mean_abs_shap": shap_abs_mean})
feat_imp = feat_imp.sort_values("mean_abs_shap", ascending=False).head(20)

plt.figure(figsize=(8,6))
sns.barplot(x="mean_abs_shap", y="feature", data=feat_imp)
plt.title("Top 20 Features by SHAP Importance")
plt.tight_layout()
plt.savefig(os.path.join(OUTDIR, "shap_feature_importance.png"))
plt.close()

# --- SHAP summary plot ---
shap.summary_plot(shap_values, X_transformed, feature_names=feature_names, show=False)
plt.tight_layout()
plt.savefig(os.path.join(OUTDIR, "shap_summary.png"))
plt.close()

# Optional: explain single prediction
sample_idx = 0
shap.force_plot(explainer.expected_value, shap_values[sample_idx,:], X_transformed[sample_idx,:],
                feature_names=feature_names, matplotlib=True, show=False)
plt.savefig(os.path.join(OUTDIR, "shap_force_sample0.png"), bbox_inches="tight")
plt.close()

# Save SHAP feature importance table
feat_imp.to_csv(os.path.join(OUTDIR, "shap_feature_importance.csv"), index=False)

print(f"SHAP plots and table saved in {OUTDIR}/")
