# app_lca_recommend.py
import streamlit as st
import joblib, traceback
import pandas as pd, numpy as np, matplotlib.pyplot as plt
import shap, math
import seaborn as sns
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from lca_input_utils import sanitize_and_validate_row
from lca_recommend import generate_recommendations

sns.set(style="whitegrid")
st.set_page_config(page_title="LCA AI Calculator + Recommendations", layout="wide")
st.title("AI LCA Calculator & Recommendation Engine")

# safe DF display helper (small)
def safe_df(df, max_chars=200):
    df2 = df.copy()
    for col in df2.columns:
        if df2[col].dtype == object:
            df2[col] = df2[col].astype(str).apply(lambda s: s if len(s) <= max_chars else s[:max_chars]+"...")
    return df2

# load model + split
@st.cache_resource
def load_artifacts():
    model = joblib.load("model_rf.pkl")
    X_train, X_test, y_train, y_test = joblib.load("train_test_split.pkl")
    return model, X_train, X_test, y_train, y_test

try:
    model, X_train, X_test, y_train, y_test = load_artifacts()
except Exception:
    st.error("Failed to load model files. Put model_rf.pkl and train_test_split.pkl in app folder.")
    st.text(traceback.format_exc())
    st.stop()

# infer expected cols
if isinstance(X_train, pd.DataFrame):
    expected_cols = X_train.columns.tolist()
else:
    expected_cols = [f"f{i}" for i in range(X_train.shape[1])]

# compute residual std from train/test to use as uncertainty
try:
    # call predict on X_train/X_test using pipeline (works for both pipeline and estimator)
    if isinstance(X_train, pd.DataFrame):
        preds_train = model.predict(X_train)
        preds_test = model.predict(X_test)
    else:
        preds_train = model.predict(X_train)
        preds_test = model.predict(X_test)
    resid = np.concatenate([ (y_train.ravel() - preds_train), (y_test.ravel() - preds_test) ])
    resid_std = np.std(resid)
    resid_mae = np.mean(np.abs(resid))
except Exception:
    resid_std = None
    resid_mae = None

st.sidebar.header("Input parameters (fill and Run prediction)")

# simple auto-detect categorical columns in training data
categorical_cols = []
if isinstance(X_train, pd.DataFrame):
    categorical_cols = [c for c in expected_cols if X_train[c].dtype == "object" or str(X_train[c].dtype).startswith("category")]

# choose metal column if present
metal_candidates = [c for c in expected_cols if "metal" in c.lower() or "material" in c.lower()]
metal_col = metal_candidates[0] if metal_candidates else None

# build sidebar widgets dynamically
with st.sidebar.form("input_form"):
    selected_metals = st.multiselect("Select metal(s)", options=(X_train[metal_col].dropna().unique().tolist() if metal_col and isinstance(X_train, pd.DataFrame) else ["Aluminium"]), default=( [X_train[metal_col].dropna().unique().tolist()[0]] if metal_col and isinstance(X_train, pd.DataFrame) else ["Aluminium"]))
    route = st.selectbox("Route", options=(X_train["route"].dropna().unique().tolist() if "route" in expected_cols and isinstance(X_train, pd.DataFrame) else ["Primary","Recycled"]))
    # for numeric inputs: show a few typical numeric columns if present
    numeric_defaults = {}
    for c in expected_cols:
        if isinstance(X_train, pd.DataFrame) and X_train[c].dtype != object:
            numeric_defaults[c] = float(X_train[c].mean())
    # show up to 10 numeric controls
    numeric_inputs = {}
    shown = 0
    for c, default in numeric_defaults.items():
        numeric_inputs[c] = st.number_input(c, value=default, format="%.6f")
        shown += 1
        if shown >= 12:
            break
    submitted = st.form_submit_button("Run prediction")

if not submitted:
    st.info("Fill inputs in the sidebar and click Run prediction.")
    st.stop()

# build rows for each selected metal, sanitize & run
results = []
recommendations_all = []
for metal in selected_metals:
    # build input dict
    input_dict = {}
    # include numeric inputs (from sidebar)
    input_dict.update(numeric_inputs)
    # include categorical metal and route if those columns exist in expected_cols
    if metal_col:
        input_dict[metal_col] = metal
    if "route" in expected_cols:
        input_dict["route"] = route
    # sanitize/validate
    df_row, issues = sanitize_and_validate_row(input_dict, expected_cols)
    if issues:
        st.warning(f"Issues for {metal}: {issues}")
    # predict
    try:
        pred = None
        if isinstance(model, Pipeline):
            pred = model.predict(df_row)[0]
            # transform for shap (we will need preprocessor)
        else:
            # plain estimator
            pred = model.predict(df_row.values.astype(float))[0]
    except Exception as e:
        st.error(f"Prediction failed for {metal}: {e}")
        st.text(traceback.format_exc())
        pred = np.nan
    # uncertainty estimate using resid_std
    if resid_std is not None and not np.isnan(pred):
        z = 1.96  # 95% approx
        lower = max(0.0, pred - z*resid_std)
        upper = min(1.0, pred + z*resid_std)
    else:
        lower, upper = np.nan, np.nan
    results.append({"metal": metal, "predicted_MCI": float(pred) if not np.isnan(pred) else np.nan, "ci_lower": lower, "ci_upper": upper, "issues": issues, "input_row": df_row})

    # SHAP explanation + recommendations
    try:
        # extract tree estimator in pipeline if present
        estimator = model
        preproc = None
        if isinstance(model, Pipeline):
            for step in model.named_steps.values():
                if isinstance(step, ColumnTransformer):
                    preproc = step
                if hasattr(step, "feature_importances_"):
                    estimator = step
        # get transformed features for SHAP
        if preproc is not None:
            X_for_shap = preproc.transform(df_row)
            # some transformers support get_feature_names_out
            try:
                feature_names = preproc.get_feature_names_out()
            except Exception:
                # fallback to numeric column names
                feature_names = [f"f{i}" for i in range(X_for_shap.shape[1])]
        else:
            X_for_shap = df_row.values
            feature_names = df_row.columns.tolist()
        expl = shap.TreeExplainer(estimator)
        shap_vals = expl.shap_values(X_for_shap)
        # shap_vals may be 2D or list (for multiclass) — for regression it's 2D or 1D
        if isinstance(shap_vals, list):
            shap_row = np.array(shap_vals[0]).ravel()
        else:
            shap_row = np.array(shap_vals).ravel()
        # generate recommendations based on shap_row and feature_names
        recs = generate_recommendations(feature_names.tolist(), shap_row, max_recs=5)
    except Exception:
        recs = [{"feature": "N/A", "shap": 0.0, "message": "SHAP could not be computed for this model or sample", "action": "none"}]
    recommendations_all.append({"metal": metal, "recs": recs})

# Display results
st.header("Prediction results")
for r in results:
    st.subheader(f"{r['metal']}")
    st.write("Input (first 20 cols):")
    st.write(safe_df(r["input_row"].iloc[:, :20]))
    if math.isnan(r["predicted_MCI"]):
        st.error("Prediction failed for this metal (see messages above).")
    else:
        st.success(f"Predicted MCI = {r['predicted_MCI']:.6f} (95% CI ≈ [{r['ci_lower']:.6f}, {r['ci_upper']:.6f}])")
    # find recommendations
    rec_obj = next((x for x in recommendations_all if x["metal"] == r["metal"]), None)
    if rec_obj:
        st.markdown("**Recommendations (top drivers that lower MCI):**")
        for rec in rec_obj["recs"]:
            st.write(f"- **{rec['feature']}** (SHAP={rec['shap']:.4f}): {rec['message']}")

# Diagnostics
st.header("Diagnostics (training residuals)")
if resid_std is not None:
    st.write(f"Residual std (train+test): {resid_std:.6f}  —  MAE: {resid_mae:.6f}")
    fig, ax = plt.subplots()
    sns.histplot(resid, bins=40, kde=True, ax=ax)
    ax.set_title("Residuals (train+test)")
    st.pyplot(fig)
else:
    st.info("Residuals unavailable; unable to compute prediction intervals.")

# Download CSV of results
res_df = pd.DataFrame([{"metal": r["metal"], "predicted_MCI": r["predicted_MCI"], "ci_lower": r["ci_lower"], "ci_upper": r["ci_upper"]} for r in results])
st.download_button("Download results CSV", res_df.to_csv(index=False).encode("utf-8"), "lca_results.csv", "text/csv")
