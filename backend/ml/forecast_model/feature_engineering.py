import datetime
import numpy as np
import pandas as pd
from typing import List, Dict, Any, Optional

MIN_REAL_OBSERVATIONS = 3

def compute_trend_slope(dates: List[datetime.datetime], values: List[float]) -> float:
    """Compute linear trend slope (change per day) using numpy Polyfit."""
    if len(values) < 2:
        return 0.0
    try:
        # Convert dates to numeric days from first observation
        base_date = min(dates)
        x = np.array([(d - base_date).days for d in dates], dtype=float)
        y = np.array(values, dtype=float)
        if np.all(x == x[0]):
            return 0.0
        slope, _ = np.polyfit(x, y, 1)
        return float(slope)
    except Exception as e:
        print(f"[Slope Calculation Warning] {e}")
        return 0.0

def extract_forecast_features_for_structure(
    structure_data: Dict[str, Any],
    satellite_observations: List[Dict[str, Any]],
    condition_score: float = 20.0
) -> Optional[Dict[str, float]]:
    """
    Extract tabular features for XGBoost forecast model.
    CRITICAL REQUIREMENT: Filters out observations where data_source == 'synthetic'.
    Returns None if len(real_observations) < MIN_REAL_OBSERVATIONS.
    """
    # 1. Observation-level filtering: keep only real observations
    real_obs = [obs for obs in satellite_observations if obs.get("data_source") == "real"]

    if len(real_obs) < MIN_REAL_OBSERVATIONS:
        # Exclude structure from training due to insufficient real observations
        return None

    # Sort observations chronologically
    real_obs = sorted(real_obs, key=lambda x: x["observation_date"])
    dates = [obs["observation_date"] for obs in real_obs]
    ndvi_vals = [float(obs["ndvi"]) for obs in real_obs]
    ndwi_vals = [float(obs["ndwi"]) for obs in real_obs]

    # Calculate trends and statistics
    ndvi_slope = compute_trend_slope(dates, ndvi_vals)
    ndwi_slope = compute_trend_slope(dates, ndwi_vals)
    
    ndvi_mean = float(np.mean(ndvi_vals))
    ndwi_mean = float(np.mean(ndwi_vals))
    ndvi_volatility = float(np.std(ndvi_vals)) if len(ndvi_vals) > 1 else 0.0

    # Calculate structure age
    constr_year = structure_data.get("construction_year", 2020)
    current_year = datetime.datetime.utcnow().year
    structure_age = float(max(1, current_year - constr_year))

    # Stub integrations for climate and soil
    from backend.ingestion.stubs.soil_stub import SoilDataIngestionStub
    soil_stub = SoilDataIngestionStub().fetch(
        structure_data.get("latitude", 0.0), structure_data.get("longitude", 0.0)
    )

    return {
        "ndvi_mean": ndvi_mean,
        "ndvi_slope": ndvi_slope,
        "ndwi_mean": ndwi_mean,
        "ndwi_slope": ndwi_slope,
        "ndvi_volatility": ndvi_volatility,
        "condition_score": float(condition_score),
        "structure_age_years": structure_age,
        "soil_slope_pct": float(soil_stub.get("slope_percentage", 4.0)),
        "real_obs_count": float(len(real_obs))
    }
