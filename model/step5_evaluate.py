# step5_evaluate.py (fixed + more robust)
import os
import joblib
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer

sns.set(style="whitegrid", rc={"figure.figsize": (7,5)})

# Ensure output directory exists BEFORE any savefig call
OUTDIR = "outputs_eval"
os.makedirs(OUTDIR, exist_ok=True)

# Load model and data
model = joblib.load("model_rf.pkl")
X_train, X_test, y_train, y_test = joblib.load("train_test_split.pkl")

# Predict
y_pred = model.predict(X_test)

# Metrics
mae = mean_absolute_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)

print("MAE:", round(mae, 4))
print("R²:", round(r2, 4))

# --- Plot 1: Actual vs Predicted MCI ---
plt.figure()
sns.scatterplot(x=y_test, y=y_pred, alpha=0.5)
minv = min(np.min(y_test), np.min(y_pred))
maxv = max(np.max(y_test), np.max(y_pred))
plt.plot([minv, maxv], [minv, maxv], "r--")
plt.xlabel("Actual MCI")
plt.ylabel("Predicted MCI")
plt.title("Predicted vs Actual MCI")
plt.savefig(os.path.join(OUTDIR, "pred_vs_actual.png"), bbox_inches="tight")
plt.close()

# --- Plot 2: Residuals ---
residuals = (y_test - y_pred).ravel()  # ensure 1d
plt.figure()
sns.histplot(residuals, bins=40, kde=True)
plt.xlabel("Residual (Actual - Predicted)")
plt.title("Residual Distribution")
plt.savefig(os.path.join(OUTDIR, "residuals.png"), bbox_inches="tight")
plt.close()

# --- Feature Importance ---
# Try to find the fitted tree-based estimator and the preprocessor
rf = None
preprocessor = None

# If the model is a Pipeline, inspect named_steps
if isinstance(model, Pipeline):
    # try to locate preprocessor (common name) and rf (any estimator with feature_importances_)
    for name, step in model.named_steps.items():
        if isinstance(step, ColumnTransformer):
            preprocessor = step
        # find estimator with feature_importances_ attribute
        if hasattr(step, "feature_importances_"):
            rf = step
    # also try to get preprocessor via typical name 'preprocessor'
    if preprocessor is None and "preprocessor" in model.named_steps:
        preprocessor = model.named_steps["preprocessor"]
else:
    # model not a pipeline
    if hasattr(model, "feature_importances_"):
        rf = model

if rf is None:
    print("Warning: could not find a tree-based estimator (with feature_importances_). Skipping feature importance plot.")
else:
    # attempt to obtain feature names
    feature_names = None
    try:
        # ColumnTransformer in modern sklearn exposes get_feature_names_out
        if preprocessor is not None and hasattr(preprocessor, "get_feature_names_out"):
            feature_names = preprocessor.get_feature_names_out()
        elif preprocessor is not None and hasattr(preprocessor, "transformers_"):
            # fallback: build names from transformers_
            names = []
            for trans_name, transformer, cols in preprocessor.transformers_:
                if transformer == "drop" or transformer is None:
                    continue
                # If transformer has get_feature_names_out (e.g., OneHotEncoder inside a pipeline)
                try:
                    if hasattr(transformer, "get_feature_names_out"):
                        out = transformer.get_feature_names_out(cols)
                        names.extend(out)
                    elif hasattr(transformer, "named_steps") and any(hasattr(t, "get_feature_names_out") for t in transformer.named_steps.values()):
                        # pipeline inside transformer
                        last = list(transformer.named_steps.values())[-1]
                        if hasattr(last, "get_feature_names_out"):
                            out = last.get_feature_names_out(cols)
                            names.extend(out)
                        else:
                            # fallback: use input column names
                            names.extend(cols)
                    else:
                        # fallback: use input column names
                        names.extend(cols)
                except Exception:
                    names.extend(cols)
            feature_names = np.array(names)
        else:
            feature_names = np.array([f"f{i}" for i in range(X_train.shape[1])])
    except Exception as e:
        print("Warning while extracting feature names:", e)
        feature_names = np.array([f"f{i}" for i in range(X_train.shape[1])])

    importances = rf.feature_importances_
    if len(importances) != len(feature_names):
        print(f"Warning: number of importances ({len(importances)}) != number of feature names ({len(feature_names)}).")
        # Try to align by truncating/padding feature_names
        n = min(len(importances), len(feature_names))
        feature_names = feature_names[:n]
        importances = importances[:n]

    feat_imp = pd.DataFrame({"feature": feature_names, "importance": importances})
    feat_imp = feat_imp.sort_values("importance", ascending=False).head(20)

    plt.figure(figsize=(8,6))
    sns.barplot(x="importance", y="feature", data=feat_imp)
    plt.title("Top 20 Important Features for MCI")
    plt.tight_layout()
    plt.savefig(os.path.join(OUTDIR, "feature_importance.png"), bbox_inches="tight")
    plt.close()

    # Save feature importance table
    feat_imp.to_csv(os.path.join(OUTDIR, "feature_importance.csv"), index=False)

print(f"Plots and feature importance (if computed) saved in {OUTDIR}/")
