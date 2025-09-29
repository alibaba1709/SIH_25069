# step6_crossval.py
import os
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import cross_val_score, cross_val_predict, KFold
from sklearn.metrics import mean_absolute_error, r2_score
import warnings
warnings.filterwarnings("ignore")

OUTDIR = "outputs_eval"
os.makedirs(OUTDIR, exist_ok=True)

# Load pipeline and train/test split
model = joblib.load("model_rf.pkl")
X_train, X_test, y_train, y_test = joblib.load("train_test_split.pkl")

# Combine X_train and X_test into a DataFrame with column names
def combine(Xa, Xb):
    if isinstance(Xa, pd.DataFrame) and isinstance(Xb, pd.DataFrame):
        return pd.concat([Xa, Xb], ignore_index=True)
    elif isinstance(Xa, np.ndarray) and isinstance(Xb, np.ndarray):
        n_cols = Xa.shape[1]
        cols = [f"f{i}" for i in range(n_cols)]
        df_a = pd.DataFrame(Xa, columns=cols)
        df_b = pd.DataFrame(Xb, columns=cols)
        return pd.concat([df_a, df_b], ignore_index=True)
    else:
        # one is DataFrame, the other is ndarray
        if isinstance(Xa, pd.DataFrame):
            df_b = pd.DataFrame(Xb, columns=Xa.columns)
            return pd.concat([Xa, df_b], ignore_index=True)
        else:
            df_a = pd.DataFrame(Xa, columns=Xb.columns)
            return pd.concat([df_a, Xb], ignore_index=True)

X = combine(X_train, X_test)
y = np.concatenate([np.ravel(y_train), np.ravel(y_test)])

print("Data shapes -> X:", X.shape, "y:", y.shape)

# K-Fold CV settings
n_splits = 5
kf = KFold(n_splits=n_splits, shuffle=True, random_state=42)

# Cross-validation: MAE and R²
scores_mae = cross_val_score(model, X, y, scoring="neg_mean_absolute_error", cv=kf, n_jobs=-1)
scores_r2  = cross_val_score(model, X, y, scoring="r2", cv=kf, n_jobs=-1)

mae_scores = -scores_mae  # convert back to positive MAE
print(f"\n{kf.get_n_splits()}-fold CV MAE: mean = {mae_scores.mean():.6f}, std = {mae_scores.std():.6f}")
print(f"{kf.get_n_splits()}-fold CV R² : mean = {scores_r2.mean():.6f}, std = {scores_r2.std():.6f}")

# Cross-validated predictions (optional)
y_pred_cv = cross_val_predict(model, X, y, cv=kf, n_jobs=-1)
mae_cv = mean_absolute_error(y, y_pred_cv)
r2_cv  = r2_score(y, y_pred_cv)
print(f"\nCross-val predicted on full data -> MAE = {mae_cv:.6f}, R² = {r2_cv:.6f}")

# Save CV results to CSV
res_df = pd.DataFrame({
    "fold": list(range(1, n_splits+1)),
    "mae_fold": mae_scores,
    "r2_fold": scores_r2
})
res_df.loc["mean"] = ["mean", mae_scores.mean(), scores_r2.mean()]
res_df.loc["std"]  = ["std",  mae_scores.std(),  scores_r2.std()]
res_df.to_csv(os.path.join(OUTDIR, "cv_results.csv"), index=False)

print(f"\nSaved CV results to {OUTDIR}/cv_results.csv")
