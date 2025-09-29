# SIH_25069

# AI-LCA Tool

AI-LCA Tool is a Streamlit application for Life Cycle Assessment (LCA) and material circularity analysis for metals. It predicts environmental impacts and a Material Circularity Index (MCI), explains drivers, and provides recommendations.

---

## Models used
- **Random Forest (final model / pipeline)**
- Gradient Boosting (explored)
- XGBoost (explored)

---

## Main libraries & tools
- **Streamlit** — web UI  
- pandas, numpy — data handling  
- scikit-learn — preprocessing, imputation, modeling, pipelines  
- xgboost — optional/experimental models  
- shap — explainability (feature attributions)  
- plotly, matplotlib, seaborn — visualizations  
- joblib — model persistence  
- reportlab — PDF report export

---

## Quick run
```bash
pip install -r requirements.txt
streamlit run app/app.py
