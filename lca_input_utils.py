# lca_input_utils.py
import pandas as pd
import numpy as np

NUMERIC_RANGES = {
    # sensible defaults; adjust to your domain
    "energy_MJ_per_kg": (0, 1e4),
    "emissions_kgCO2e_per_kg": (0, 1e4),
    "mining_energy_MJ_per_kg": (0, 1e5),
    "smelting_energy_MJ_per_kg": (0, 1e5),
    "transport_distance_km": (0, 1e6),
    "economic_value_USD_per_kg": (0, 1e6),
    "material_recycled_content_fraction": (0.0, 1.0),
    "product_lifetime_years": (0.0, 200.0),
    # add keys that match your dataset
}

def sanitize_and_validate_row(row: dict, expected_cols: list):
    """
    Build a DataFrame row (1 x N) matching `expected_cols`.
    Validates numeric ranges if keys present in NUMERIC_RANGES.
    Returns (df_row, issues_list). df_row has columns expected_cols.
    """
    issues = []
    # start with defaults if you want; here we fill with provided values
    row_copy = {}
    for c in expected_cols:
        if c in row:
            row_copy[c] = row[c]
        else:
            # fill missing with a safe default placeholder
            row_copy[c] = "" if isinstance(c, str) else 0.0

    # Validate numeric ranges where applicable
    for k, (lo, hi) in NUMERIC_RANGES.items():
        if k in row_copy:
            try:
                v = float(row_copy[k])
                if not (lo <= v <= hi):
                    issues.append(f"{k}={v} out of expected range [{lo}, {hi}]")
            except Exception:
                issues.append(f"{k} could not be converted to float")
    # Create DataFrame
    df = pd.DataFrame([row_copy], columns=expected_cols)
    return df, issues
