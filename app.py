# app.py
import streamlit as st
import joblib, traceback
import pandas as pd, numpy as np, matplotlib.pyplot as plt
import shap, math
import seaborn as sns
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer

# local helpers (must exist in your repo)
from lca_input_utils import sanitize_and_validate_row
from lca_recommend import generate_recommendations

# optional circularity module (if present)
try:
    from circularity_ai_refactor import CircularityAIRefactored
except Exception:
    CircularityAIRefactored = None

sns.set(style="whitegrid")
st.set_page_config(page_title="LCA AI Calculator + Recommendations", layout="wide")
st.title("AI LCA Calculator & Recommendation Engine")

MAX_NUMERIC_CONTROLS = 20  # how many numeric controls to show in sidebar (tweak as desired)

# -------------------- utils --------------------
def safe_df(df, max_chars=200):
    df2 = df.copy()
    for col in df2.columns:
        if df2[col].dtype == object:
            df2[col] = df2[col].astype(str).apply(lambda s: s if len(s) <= max_chars else s[:max_chars] + "...")
    return df2

@st.cache_resource
def load_artifacts():
    """Load model and train/test split (cached)"""
    model = joblib.load("model_rf.pkl")
    X_train, X_test, y_train, y_test = joblib.load("train_test_split.pkl")
    return model, X_train, X_test, y_train, y_test

@st.cache_resource
def load_circularity_ai(possible_paths=None):
    """Try to instantiate CircularityAIRefactored (cached). Returns (ai_obj, path) or (None, None)."""
    if CircularityAIRefactored is None:
        return None, None
    candidates = possible_paths or [
        "LCA_multi_metal_with_MCI.csv",
        "data/LCA_multi_metal_with_MCI.csv",
        "data/materials_dataset.csv",
        "data/sample_inputs.csv"
    ]
    for p in candidates:
        try:
            ai = CircularityAIRefactored(p)
            return ai, p
        except Exception:
            continue
    return None, None

def find_tree_estimator_and_preprocessor(pipeline_or_estimator):
    """
    If a Pipeline is passed, try to locate the final tree estimator and a ColumnTransformer preprocessor.
    Returns (estimator_or_None, preprocessor_or_None)
    """
    est = None
    preproc = None
    if isinstance(pipeline_or_estimator, Pipeline):
        # search for ColumnTransformer (preprocessor) and for final estimator that has feature_importances_
        for name, step in pipeline_or_estimator.named_steps.items():
            if isinstance(step, ColumnTransformer) and preproc is None:
                preproc = step
        # find last step that looks like a tree estimator
        for name, step in reversed(list(pipeline_or_estimator.named_steps.items())):
            if hasattr(step, "feature_importances_") or (hasattr(step, "predict") and getattr(step, "__class__").__name__.lower().startswith(("randomforest","lgb","xgb","catboost"))):
                est = step
                break
    else:
        # plain estimator
        if hasattr(pipeline_or_estimator, "feature_importances_") or hasattr(pipeline_or_estimator, "predict"):
            est = pipeline_or_estimator
    return est, preproc

# -------------------- load model artifacts --------------------
try:
    model, X_train, X_test, y_train, y_test = load_artifacts()
except Exception:
    st.error("Failed to load model files. Put model_rf.pkl and train_test_split.pkl in app folder.")
    st.text(traceback.format_exc())
    st.stop()

# expected columns
if isinstance(X_train, pd.DataFrame):
    expected_cols = X_train.columns.tolist()
else:
    expected_cols = [f"f{i}" for i in range(X_train.shape[1])]

# compute residuals for CI
try:
    preds_train = model.predict(X_train)
    preds_test = model.predict(X_test)
    resid = np.concatenate([(y_train.ravel() - preds_train), (y_test.ravel() - preds_test)])
    resid_std = float(np.std(resid))
    resid_mae = float(np.mean(np.abs(resid)))
except Exception:
    resid_std = None
    resid_mae = None
    resid = None

# -------------------- Circularity AI loading --------------------
ai, ai_path = load_circularity_ai()
if ai is None:
    st.info("Circularity AI dataset not loaded automatically. Place 'LCA_multi_metal_with_MCI.csv' in repo root or data/ if needed.")
else:
    st.info(f"Circularity AI dataset loaded from: {ai_path} (rows={len(ai.df)})")

# -------------------- Sidebar: inputs --------------------
st.sidebar.header("Input parameters (fill and Run prediction)")
show_debug = st.sidebar.checkbox("Show detected columns (debug)", value=False)

# detect categorical columns robustly
categorical_cols = []
if isinstance(X_train, pd.DataFrame):
    for c in expected_cols:
        # consider object or category dtype, or small unique count as categorical
        try:
            dtype = X_train[c].dtype
            if dtype == object or str(dtype).startswith("category") or X_train[c].nunique(dropna=True) <= 20:
                categorical_cols.append(c)
        except Exception:
            continue

# detect metal/material column
metal_candidates = [c for c in expected_cols if "metal" in c.lower() or "material" in c.lower()]
metal_col = metal_candidates[0] if metal_candidates else None

# prepare numeric defaults by coercing types safely (do not alter original X_train)
numeric_defaults = {}
if isinstance(X_train, pd.DataFrame):
    # copy limited columns only
    for c in expected_cols:
        # attempt to coerce to numeric
        try:
            coerced = pd.to_numeric(X_train[c], errors="coerce")
            # treat column as numeric if at least one non-NaN exists and dtype isn't object-like
            if coerced.notna().sum() > 0 and (np.issubdtype(coerced.dtype, np.number) or X_train[c].dtype != object):
                # compute mean ignoring NaN
                mean_val = float(coerced.mean()) if coerced.notna().sum() > 0 else 0.0
                numeric_defaults[c] = mean_val
        except Exception:
            continue

# build sidebar form
with st.sidebar.form("input_form"):
    # metals multiselect
    if metal_col and isinstance(X_train, pd.DataFrame):
        try:
            metals_list = X_train[metal_col].dropna().unique().tolist()
        except Exception:
            metals_list = ["Aluminium", "Copper", "Steel"]
        if len(metals_list) == 0:
            metals_list = ["Aluminium", "Copper", "Steel"]
        selected_metals = st.multiselect("Select metal(s)", options=metals_list, default=[metals_list[0]])
    else:
        selected_metals = st.multiselect("Select metal(s)", options=["Aluminium","Copper","Steel"], default=["Aluminium"])
    # route selectbox (if present in expected_cols)
    if "route" in expected_cols and isinstance(X_train, pd.DataFrame):
        try:
            route_opts = X_train["route"].dropna().unique().tolist()
            if len(route_opts) == 0:
                route_opts = ["Primary", "Recycled"]
        except Exception:
            route_opts = ["Primary", "Recycled"]
    else:
        route_opts = ["Primary", "Recycled"]
    route = st.selectbox("Route", options=route_opts)

    # numeric controls: choose up to MAX_NUMERIC_CONTROLS of numeric_defaults sorted by variance/popularity
    numeric_inputs = {}
    if numeric_defaults:
        # pick columns with most non-nulls first
        def non_null_count(col):
            try:
                return X_train[col].notna().sum()
            except Exception:
                return 0
        sorted_cols = sorted(numeric_defaults.keys(), key=lambda c: (-non_null_count(c), c))
        for c in sorted_cols[:MAX_NUMERIC_CONTROLS]:
            default = numeric_defaults.get(c, 0.0)
            # ensure default is finite numeric
            if default is None or (isinstance(default, float) and (np.isnan(default) or np.isinf(default))):
                default = 0.0
            numeric_inputs[c] = st.number_input(c, value=float(default), format="%.6f")

    else:
        # fallback generic numeric controls if X_train not a DataFrame
        for i in range(min(MAX_NUMERIC_CONTROLS, len(expected_cols))):
            cname = f"f{i}"
            numeric_inputs[cname] = st.number_input(cname, value=0.0, format="%.6f")

    submitted = st.form_submit_button("Run prediction")

if not submitted:
    st.info("Fill inputs in the sidebar and click Run prediction.")
    st.stop()

if show_debug:
    st.sidebar.write("Expected cols:", expected_cols)
    st.sidebar.write("Detected categorical cols:", categorical_cols)
    st.sidebar.write("Detected metal col:", metal_col)
    st.sidebar.write("Numeric controls shown:", list(numeric_inputs.keys()))

# -------------------- prediction loop --------------------
results = []
recommendations_all = []

# Prepare SHAP estimator & preprocessor once
estimator_for_shap, preproc_for_shap = find_tree_estimator_and_preprocessor(model)

for metal in selected_metals:
    # build input dict
    input_dict = {}
    input_dict.update(numeric_inputs)
    if metal_col:
        input_dict[metal_col] = metal
    if "route" in expected_cols:
        input_dict["route"] = route

    # sanitize & align
    try:
        df_row, issues = sanitize_and_validate_row(input_dict, expected_cols)
    except Exception as e:
        st.error(f"sanitize_and_validate_row failed for {metal}: {e}")
        df_row = pd.DataFrame([input_dict], columns=expected_cols) if isinstance(expected_cols, list) else pd.DataFrame([input_dict])
        issues = [str(e)]

    if issues:
        st.warning(f"Issues for {metal}: {issues}")

    # prediction
    pred = np.nan
    try:
        if isinstance(model, Pipeline):
            pred = model.predict(df_row)[0]
        else:
            # ensure numeric array safe conversion
            arr = df_row.values.astype(float)
            pred = model.predict(arr)[0]
    except Exception as e:
        st.error(f"Prediction failed for {metal}: {e}")
        st.text(traceback.format_exc())
        pred = np.nan

    # CI estimate
    if resid_std is not None and not np.isnan(pred):
        z = 1.96
        lower = max(0.0, pred - z * resid_std)
        upper = min(1.0, pred + z * resid_std)
    else:
        lower, upper = np.nan, np.nan

    # SHAP-driven recs
    recs_shap = []
    try:
        if estimator_for_shap is not None:
            # prepare transformed X for SHAP
            if preproc_for_shap is not None:
                X_for_shap = preproc_for_shap.transform(df_row)
                try:
                    feature_names = preproc_for_shap.get_feature_names_out()
                except Exception:
                    feature_names = [f"f{i}" for i in range(X_for_shap.shape[1])]
            else:
                X_for_shap = df_row.values
                feature_names = df_row.columns.tolist()

            expl = shap.TreeExplainer(estimator_for_shap)
            shap_vals = expl.shap_values(X_for_shap)
            if isinstance(shap_vals, list):
                shap_row = np.array(shap_vals[0]).ravel()
            else:
                shap_row = np.array(shap_vals).ravel()

            try:
                recs_shap = generate_recommendations(list(map(str, feature_names)), shap_row, max_recs=5)
            except Exception:
                # fallback: top absolute shap drivers
                abs_idx = np.argsort(-np.abs(shap_row))[:5]
                recs_shap = []
                for i in abs_idx:
                    fname = feature_names[i] if i < len(feature_names) else f"f{i}"
                    recs_shap.append({
                        "feature": fname,
                        "shap": float(shap_row[i]),
                        "message": "Driver identified by SHAP",
                        "action": "Consider improving this parameter"
                    })
        else:
            recs_shap = [{"feature": "N/A", "shap": 0.0, "message": "SHAP not available", "action": "none"}]
    except Exception:
        recs_shap = [{"feature": "N/A", "shap": 0.0, "message": "SHAP error", "action": "none"}]

    # Circularity AI analysis (if loaded)
    circ_result = None
    if ai is not None:
        try:
            circ_result = ai.run_analysis(input_dict)
        except Exception:
            circ_result = None

    results.append({
        "metal": metal,
        "predicted_MCI": float(pred) if not np.isnan(pred) else np.nan,
        "ci_lower": lower,
        "ci_upper": upper,
        "issues": issues,
        "input_row": df_row,
        "shap_recs": recs_shap,
        "circ": circ_result
    })

# -------------------- display --------------------
st.header("Prediction results")
for r in results:
    st.subheader(f"{r['metal']}")
    st.write("Input (first 20 cols):")
    try:
        st.write(safe_df(r["input_row"].iloc[:, :20]))
    except Exception:
        st.write(safe_df(r["input_row"]))

    if math.isnan(r["predicted_MCI"]):
        st.error("Prediction failed for this metal (see messages above).")
    else:
        st.success(f"Predicted MCI = {r['predicted_MCI']:.6f}")
        if not np.isnan(r["ci_lower"]) and not np.isnan(r["ci_upper"]):
            st.caption(f"Approx 95% CI ≈ [{r['ci_lower']:.6f}, {r['ci_upper']:.6f}] (residual-based)")

    st.markdown("**SHAP-driven recommendations (top drivers):**")
    try:
        for rec in r["shap_recs"]:
            st.write(f"- **{rec.get('feature','?')}** (SHAP={rec.get('shap',0.0):.4f}): {rec.get('message','')}")
    except Exception:
        st.write("- No SHAP recommendations available.")

    # Circularity AI outputs
    if r["circ"] is not None:
        st.markdown("**Circularity AI: Baseline / Optimized / Ideal**")
        try:
            base = r["circ"]["baseline"]
            opt = r["circ"]["optimized"]
            ideal = r["circ"]["ideal"]
            c1, c2, c3 = st.columns(3)
            c1.metric("Baseline MCI", f"{base.get('mci','n/a')}", delta=f"comp {base.get('composite','')}")
            c2.metric("Optimized MCI", f"{opt.get('mci','n/a')}", delta=f"comp {opt.get('composite','')}")
            c3.metric("Ideal MCI", f"{(ideal.get('mci', 0)/100):.3f}", delta=f"comp {ideal.get('composite','')}")

            st.write("**Recommendations:**")
            for text in r["circ"].get("recommendations", []):
                st.write("-", text)
            # comparison table (selected)
            df_compare = pd.DataFrame({
                "Baseline": pd.Series(r["circ"].get("aligned_input", {})),
                "Optimized": pd.Series(r["circ"].get("optimized_input", {})),
                "Ideal": pd.Series(r["circ"].get("ideal_input", {}))
            })
            df_compare.loc["MCI Score"] = [base.get("mci"), opt.get("mci"), ideal.get("mci")]
            df_compare.loc["Efficiency %"] = [base.get("efficiency_pct"), opt.get("efficiency_pct"), 100.0]
            st.write("Comparison table (selected features):")
            st.write(safe_df(df_compare.iloc[:, :6]))
        except Exception:
            st.write("Circularity AI result present but failed to render.")
    else:
        st.info("Circularity AI analysis not available for this run.")

# -------------------- diagnostics --------------------
st.header("Diagnostics (training residuals)")
if resid_std is not None:
    st.write(f"Residual std (train+test): {resid_std:.6f}  —  MAE: {resid_mae:.6f}")
    fig, ax = plt.subplots()
    sns.histplot(resid, bins=40, kde=True, ax=ax)
    ax.set_title("Residuals (train+test)")
    st.pyplot(fig)
else:
    st.info("Residuals unavailable; unable to compute prediction intervals.")

# -------------------- download --------------------
res_df = pd.DataFrame([{
    "metal": r["metal"],
    "predicted_MCI": r["predicted_MCI"],
    "ci_lower": r["ci_lower"],
    "ci_upper": r["ci_upper"],
    "recommendations": "; ".join(r["circ"].get("recommendations", [])) if r["circ"] else ""
} for r in results])
st.download_button("Download results CSV", res_df.to_csv(index=False).encode("utf-8"), "lca_results.csv", "text/csv")
