#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer

class CircularityAIRefactored:
    """
    Circularity AI module (clean version without LightGBM).
    """

    def __init__(self, csv_path):
        self.csv_path = csv_path
        self.df = pd.read_csv(csv_path)

        self.good_params = [
            'recycled_content_frac',
            'reuse_potential_score',
            'product_lifetime_years',
            'renewable_electricity_frac'
        ]
        self.bad_params = [
            'energy_MJ_per_kg',
            'emissions_kgCO2e_per_kg',
            'transport_distance_km'
        ]
        self.targets = ['emissions_kgCO2e_per_kg', 'MCI_percent', 'MCI']
        self.features = [c for c in self.df.columns if c not in self.targets + ['cluster']]

        self._compute_fill_values()
        self._build_clusters(n_clusters=5)

        self.recommendation_templates = {
            'energy_MJ_per_kg': "Your energy expenditure is higher than peers. Improve equipment and install VSDs.",
            'emissions_kgCO2e_per_kg': "Your carbon emissions are above peer average. Consider electrification or fuel switch.",
            'transport_distance_km': "Transport distances are long. Explore near-shoring or rail/sea shift.",
            'recycled_content_frac': "Low recycled content. Engage suppliers for secondary materials.",
            'reuse_potential_score': "Low reuse potential. Redesign for modularity and easier disassembly.",
            'product_lifetime_years': "Short lifespan. Improve durability and servicing.",
            'renewable_electricity_frac': "Low renewable electricity use. Consider PPAs or on-site solar."
        }

    def _compute_fill_values(self):
        numeric_cols = self.df.select_dtypes(include=[np.number]).columns.tolist()
        object_cols = self.df.select_dtypes(include=['object', 'category']).columns.tolist()
        self.numeric_medians = self.df[numeric_cols].median()
        self.categorical_modes = {
            c: self.df[c].mode().iloc[0] if not self.df[c].mode().empty else '' for c in object_cols
        }
        self.global_means = self.df.mean(numeric_only=True)
        self.global_medians = self.df.median(numeric_only=True)
        self.all_features = [c for c in self.df.columns if c not in self.targets + ['cluster']]

    def _align_user_input(self, user_dict):
        user_df = pd.DataFrame([user_dict])
        for col in self.all_features:
            if col not in user_df.columns:
                if col in self.numeric_medians.index:
                    user_df[col] = self.numeric_medians[col]
                else:
                    user_df[col] = self.categorical_modes.get(col, np.nan)
        for col in self.numeric_medians.index:
            if col in user_df.columns:
                user_df[col] = pd.to_numeric(user_df[col], errors='coerce').fillna(self.numeric_medians[col])
        return user_df[self.all_features]

    def _build_clusters(self, n_clusters=5):
        numeric_features = [c for c in self.all_features if c in self.numeric_medians.index]
        imputer = SimpleImputer(strategy='median')
        scaler = StandardScaler()
        Xnum = imputer.fit_transform(self.df[numeric_features])
        Xnum = scaler.fit_transform(Xnum)
        self.kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10).fit(Xnum)
        self.df['cluster'] = self.kmeans.predict(Xnum)
        self.cluster_benchmarks = {}
        for cid in sorted(self.df['cluster'].unique()):
            cluster_df = self.df[self.df['cluster'] == cid]
            self.cluster_benchmarks[cid] = {
                'means': cluster_df.mean(numeric_only=True),
                'medians': cluster_df.median(numeric_only=True),
                'counts': len(cluster_df)
            }

    def calculate_mci_score(self, user_data):
        material_mass = float(user_data.get('material_mass_kg', 1))
        lifespan = float(user_data.get('product_lifetime_years', 1))
        recycled_content = float(user_data.get('recycled_content_frac', 0))
        route = str(user_data.get('route', 'Primary')).lower()
        virgin_mass = 0
        if route.startswith('primary') or route.startswith('virgin'):
            virgin_mass = material_mass * (1 - recycled_content)
        reuse_pct = float(user_data.get('eol_reuse_pct', 0))
        recycle_pct = float(user_data.get('eol_recycle_pct', 0))
        unrecoverable_waste = material_mass * (1 - (reuse_pct + recycle_pct) / 100.0)
        lfi = (virgin_mass + unrecoverable_waste) / (2 * material_mass) if material_mass > 0 else 1
        normalized_lifespan = lifespan / 15.0 if lifespan > 0 else 1
        utility_factor = 0.9 / normalized_lifespan if normalized_lifespan > 0 else 100
        mci_raw = 1 - (lfi * utility_factor)
        mci_score = max(0, min(100, mci_raw * 100))
        return round(mci_score, 1)

    def _ideal_case_row(self):
        ideal = {}
        for col in self.all_features:
            if col in self.numeric_medians.index:
                ideal[col] = float(self.numeric_medians[col])
            else:
                ideal[col] = self.categorical_modes.get(col, np.nan)
        for g in self.good_params:
            if g in self.df.columns:
                ideal[g] = float(self.df[g].max())
        for b in self.bad_params:
            if b in self.df.columns:
                ideal[b] = float(self.df[b].min())
        if 'material_mass_kg' in self.all_features and 'material_mass_kg' in ideal:
            ideal['material_mass_kg'] = float(self.numeric_medians.get('material_mass_kg', 1))
        return ideal

    def _score_against_ideal(self, feature_row):
        ideal = self._ideal_case_row()
        closeness = []
        for col in self.all_features:
            if col not in self.numeric_medians.index:
                continue
            val = float(feature_row.get(col, self.numeric_medians[col]))
            ideal_val = float(ideal.get(col, self.numeric_medians[col]))
            if col in self.good_params:
                score = min(1.0, val / ideal_val) if ideal_val > 0 else 0.0
            elif col in self.bad_params:
                score = min(1.0, ideal_val / val) if val > 0 else 0.0
            else:
                med = float(self.numeric_medians[col])
                rng = float(self.df[col].max() - self.df[col].min()) or 1.0
                score = 1.0 - min(1.0, abs(val - med) / rng)
            closeness.append(score)
        return float(np.mean(closeness)) if closeness else 0.0

    def _optimize_user_row(self, user_row):
        optimized = user_row.copy()
        for g in self.good_params:
            if g in optimized and float(optimized[g]) < float(self.global_medians.get(g, optimized[g])):
                optimized[g] = float(self.global_medians[g])
        for b in self.bad_params:
            if b in optimized and float(optimized[b]) > float(self.global_medians.get(b, optimized[b])):
                optimized[b] = float(self.global_medians[b])
        return optimized

    def generate_recommendations(self, user_row, cluster_id=None):
        recs = []
        bench = self.global_means
        if cluster_id is not None and cluster_id in self.cluster_benchmarks:
            bench = self.cluster_benchmarks[cluster_id]['means']
        for p in (self.bad_params + self.good_params):
            if p in user_row and p in bench:
                user_val = float(user_row[p])
                bench_val = float(bench[p])
                if p in self.bad_params and user_val > bench_val:
                    recs.append(self.recommendation_templates.get(p, f"{p}: above peer average."))
                if p in self.good_params and user_val < bench_val:
                    recs.append(self.recommendation_templates.get(p, f"{p}: below peer average."))
        return recs

    def run_analysis(self, user_input):
        aligned = self._align_user_input(user_input).iloc[0].to_dict()
        numeric_features = [c for c in self.all_features if c in self.numeric_medians.index]
        cluster_id = None
        try:
            import numpy as _np
            num_row = _np.array([aligned[c] for c in numeric_features], dtype=float).reshape(1, -1)
            cluster_id = int(self.kmeans.predict(num_row)[0])
        except Exception:
            pass

        baseline_comp = self._score_against_ideal(aligned)
        baseline_mci = self.calculate_mci_score(aligned)

        optimized_row = self._optimize_user_row(aligned)
        optimized_comp = self._score_against_ideal(optimized_row)
        optimized_mci = self.calculate_mci_score(optimized_row)

        ideal_row = self._ideal_case_row()
        ideal_comp = self._score_against_ideal(ideal_row)
        ideal_mci = self.calculate_mci_score(ideal_row)

        efficiency_baseline_pct = round(100.0 * baseline_comp / (ideal_comp if ideal_comp > 0 else 1.0), 1)
        efficiency_optimized_pct = round(100.0 * optimized_comp / (ideal_comp if ideal_comp > 0 else 1.0), 1)

        recs = self.generate_recommendations(aligned, cluster_id=cluster_id)

        result = {
            'cluster_id': cluster_id,
            'baseline': {'mci': baseline_mci, 'composite': round(baseline_comp, 3), 'efficiency_pct': efficiency_baseline_pct},
            'optimized': {'mci': optimized_mci, 'composite': round(optimized_comp, 3), 'efficiency_pct': efficiency_optimized_pct},
            'ideal': {'mci': ideal_mci, 'composite': round(ideal_comp, 3)},
            'recommendations': recs,
            'aligned_input': aligned,
            'optimized_input': optimized_row,
            'ideal_input': ideal_row
        }
        return result

if __name__ == "__main__":
    file_path = 'LCA_multi_metal_with_MCI.csv'   # <-- put your CSV file path here
    ai = CircularityAIRefactored(file_path)

    user_input = {
        'material_mass_kg': 100,
        'energy_MJ_per_kg': 20,
        'emissions_kgCO2e_per_kg': 5,
        'transport_distance_km': 200,
        'recycled_content_frac': 0.2,
        'reuse_potential_score': 0.5,
        'product_lifetime_years': 8,
        'renewable_electricity_frac': 0.3,
        'route': 'Primary',
        'eol_reuse_pct': 10,
        'eol_recycle_pct': 60
    }

    results = ai.run_analysis(user_input)
    print("\n--- Results ---")
    print(results)
def run_circularity_ai(user_input: dict):
    ai = CircularityAI()
    results = ai.evaluate(user_input)
    return results
