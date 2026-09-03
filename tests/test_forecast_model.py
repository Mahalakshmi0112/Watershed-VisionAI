import datetime
import pytest
from backend.ml.forecast_model.feature_engineering import extract_forecast_features_for_structure
from backend.ml.forecast_model.bootstrap_labels import generate_weak_supervision_label

def test_observation_level_synthetic_filtering():
    now = datetime.datetime.utcnow()
    struct_data = {"latitude": 19.18, "longitude": 73.19, "construction_year": 2019}

    # Mix of 3 real observations and 2 synthetic observations
    mixed_obs = [
        {"observation_date": now - datetime.timedelta(days=90), "ndvi": 0.50, "ndwi": 0.20, "data_source": "real"},
        {"observation_date": now - datetime.timedelta(days=60), "ndvi": 0.45, "ndwi": 0.18, "data_source": "synthetic"}, # Synthetic - should be filtered
        {"observation_date": now - datetime.timedelta(days=30), "ndvi": 0.42, "ndwi": 0.15, "data_source": "real"},
        {"observation_date": now, "ndvi": 0.38, "ndwi": 0.12, "data_source": "real"},
        {"observation_date": now + datetime.timedelta(days=30), "ndvi": 0.35, "ndwi": 0.10, "data_source": "synthetic"}  # Synthetic - should be filtered
    ]

    feats = extract_forecast_features_for_structure(struct_data, mixed_obs, condition_score=45.0)
    assert feats is not None
    # 3 real observations preserved
    assert feats["real_obs_count"] == 3.0
    assert "ndvi_slope" in feats
    assert "ndvi_volatility" in feats

def test_structure_exclusion_when_under_min_real_obs():
    now = datetime.datetime.utcnow()
    struct_data = {"latitude": 19.18, "longitude": 73.19, "construction_year": 2019}

    # Only 2 real observations and 3 synthetic observations
    insufficient_obs = [
        {"observation_date": now - datetime.timedelta(days=60), "ndvi": 0.50, "ndwi": 0.20, "data_source": "real"},
        {"observation_date": now - datetime.timedelta(days=30), "ndvi": 0.45, "ndwi": 0.18, "data_source": "synthetic"},
        {"observation_date": now, "ndvi": 0.42, "ndwi": 0.15, "data_source": "real"}
    ]

    feats = extract_forecast_features_for_structure(struct_data, insufficient_obs, condition_score=20.0)
    # Should be excluded (returns None) because len(real_obs) = 2 < 3
    assert feats is None

def test_weak_supervision_labeling():
    feats_high_risk = {"ndvi_slope": -0.001, "condition_score": 50.0, "structure_age_years": 5.0}
    label1 = generate_weak_supervision_label(feats_high_risk)
    assert label1 == 1

    feats_healthy = {"ndvi_slope": 0.0005, "condition_score": 15.0, "structure_age_years": 2.0}
    label2 = generate_weak_supervision_label(feats_healthy)
    assert label2 == 0

    # Inspection outcome ground truth overrides heuristic
    label3 = generate_weak_supervision_label(feats_healthy, inspection_outcome="major_damage")
    assert label3 == 1
