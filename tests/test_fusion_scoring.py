import pytest
from backend.ml.fusion.fusion_engine import calculate_composite_score

def test_fusion_engine_default_scoring():
    # Test default scoring with w_cond=0.45, w_sat=0.25, w_fc=0.30
    res = calculate_composite_score(
        condition_score=80.0,
        satellite_trend_risk=60.0,
        forecast_risk=70.0
    )

    # Composite = 80*0.45 + 60*0.25 + 70*0.30 = 36 + 15 + 21 = 72.0
    assert res["composite_score"] == 72.0
    assert res["priority_tier"] == "Urgent"  # > 65.0

def test_fusion_engine_healthy_tier():
    res = calculate_composite_score(
        condition_score=10.0,
        satellite_trend_risk=15.0,
        forecast_risk=10.0
    )
    # Composite = 10*0.45 + 15*0.25 + 10*0.30 = 4.5 + 3.75 + 3.0 = 11.25
    assert res["composite_score"] == 11.25
    assert res["priority_tier"] == "Healthy"  # <= 30.0

def test_fusion_engine_custom_config():
    custom_cfg = {
        "weights": {"w_condition": 0.50, "w_satellite": 0.20, "w_forecast": 0.30},
        "tier_boundaries": {"healthy_max": 20.0, "monitor_max": 50.0, "urgent_min": 50.01}
    }
    res = calculate_composite_score(
        condition_score=40.0,
        satellite_trend_risk=40.0,
        forecast_risk=40.0,
        custom_config=custom_cfg
    )
    # Score = 40.0, monitor_max = 50.0 -> Monitor
    assert res["composite_score"] == 40.0
    assert res["priority_tier"] == "Monitor"
