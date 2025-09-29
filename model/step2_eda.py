# step2_eda.py
import pandas as pd
import numpy as np
from pathlib import Path
import matplotlib.pyplot as plt
import seaborn as sns

sns.set(style="whitegrid", rc={"figure.figsize": (8,5)})

DATA = "LCA_multi_metal_with_MCI.csv"  # adjust if different path
OUTDIR = Path("outputs_eda")
OUTDIR.mkdir(exist_ok=True)

df = pd.read_csv(DATA)

# Basic info
with open(OUTDIR / "eda_report.txt", "w") as f:
    f.write(f"Loaded file: {DATA}\n")
    f.write(f"Rows,Cols: {df.shape}\n\n")
    f.write("Columns:\n")
    f.write(", ".join(df.columns) + "\n\n")
    f.write("=== MCI summary ===\n")
    f.write(str(df["MCI"].describe()) + "\n\n")
    f.write("=== MCI percentiles ===\n")
    f.write(str(df["MCI"].quantile([0,.01,.05,.1,.25,.5,.75,.9,.95,.99,1.0])) + "\n\n")
    f.write("=== Missing values (per column) ===\n")
    f.write(str(df.isnull().sum().sort_values(ascending=False).head(50)) + "\n\n")
    f.write("=== Categorical value counts (top values) ===\n")
    for c in ["material","route","country","transport_mode","end_of_life_route"]:
        if c in df.columns:
            f.write(f"\n-- {c} --\n")
            f.write(str(df[c].value_counts().head(10)) + "\n")

# Save head and tails
df.head(20).to_csv(OUTDIR / "head_20.csv", index=False)
df.tail(20).to_csv(OUTDIR / "tail_20.csv", index=False)

# Plot 1: MCI histogram + KDE
plt.figure(figsize=(8,5))
sns.histplot(df["MCI"], bins=50, kde=True)
plt.title("Distribution of MCI (0-1)")
plt.xlabel("MCI")
plt.savefig(OUTDIR / "mci_hist.png", bbox_inches="tight")
plt.close()

# Plot 2: MCI by material (boxplot)
if "material" in df.columns:
    plt.figure(figsize=(10,6))
    sns.boxplot(x="material", y="MCI", data=df)
    plt.xticks(rotation=45)
    plt.title("MCI distribution by material")
    plt.savefig(OUTDIR / "mci_by_material_box.png", bbox_inches="tight")
    plt.close()

# Plot 3: Missingness heatmap (columns with some missing)
missing = df.isnull().sum()
cols_with_missing = missing[missing>0].index.tolist()
if len(cols_with_missing) > 0:
    plt.figure(figsize=(10,6))
    sns.heatmap(df[cols_with_missing].isnull().astype(int).T, cbar=False)
    plt.title("Missingness heatmap (columns with some missing values)")
    plt.savefig(OUTDIR / "missingness_heatmap.png", bbox_inches="tight")
    plt.close()

# Plot 4: Correlation matrix of numeric columns (top 20 numerics)
num = df.select_dtypes(include=[np.number]).copy()
if num.shape[1] > 1:
    corr = num.corr()
    topcols = corr.abs().sum().sort_values(ascending=False).head(20).index
    plt.figure(figsize=(12,10))
    sns.heatmap(num[topcols].corr(), annot=False, cmap="RdBu_r", center=0)
    plt.title("Correlation heatmap (top numeric columns)")
    plt.savefig(OUTDIR / "corr_heatmap.png", bbox_inches="tight")
    plt.close()

# Quick checks: rows with MCI==0 and MCI high
if "MCI" in df.columns:
    zeros = int((df["MCI"] == 0).sum())
    high = int((df["MCI"] >= 0.8).sum())
    with open(OUTDIR / "eda_report.txt", "a") as f:
        f.write(f"\nRows with MCI == 0: {zeros}\n")
        f.write(f"Rows with MCI >= 0.8: {high}\n")
        # print small sample for MCI==0
        f.write("\nSample rows with MCI == 0 (first 5):\n")
        f.write(df[df["MCI"]==0].head(5).to_string() + "\n\n")
        f.write("Sample rows with MCI >= 0.8 (first 5):\n")
        f.write(df[df['MCI']>=0.8].head(5).to_string() + "\n\n")

print("EDA complete. Results and plots are in the folder:", OUTDIR)
print("Open outputs_eda/eda_report.txt and the PNGs to inspect.")
