from typing import Dict, Any
from backend.config.settings import settings

def calculate_composite_score(
    condition_score: float,
    satellite_trend_risk: float,
    forecast_risk: float,
    custom_config: Dict[str, Any] = None
) -> Dict[str, Any]:
    """
    Calculate composite priority score and assign priority tier.
    Uses configurable weights and tier boundaries loaded from scoring_config.json.
    """
    config = custom_config if custom_config else settings.get_scoring_config()

    weights = config.get("weights", {"w_condition": 0.45, "w_satellite": 0.25, "w_forecast": 0.30})
    boundaries = config.get("tier_boundaries", {"healthy_max": 30.0, "monitor_max": 65.0, "urgent_min": 65.01})

    w_cond = weights.get("w_condition", 0.45)
    w_sat = weights.get("w_satellite", 0.25)
    w_fc = weights.get("w_forecast", 0.30)

    # Normalize components to [0, 100]
    cond_norm = max(0.0, min(100.0, float(condition_score)))
    sat_norm = max(0.0, min(100.0, float(satellite_trend_risk)))
    fc_norm = max(0.0, min(100.0, float(forecast_risk)))

    composite_score = round(w_cond * cond_norm + w_sat * sat_norm + w_fc * fc_norm, 2)

    # Resolve Priority Tier dynamically using configurable boundaries
    healthy_max = boundaries.get("healthy_max", 30.0)
    monitor_max = boundaries.get("monitor_max", 65.0)

    if composite_score <= healthy_max:
        tier = "Healthy"
    elif composite_score <= monitor_max:
        tier = "Monitor"
    else:
        tier = "Urgent"

    return {
        "condition_score": cond_norm,
        "satellite_trend_risk": sat_norm,
        "forecast_risk": fc_norm,
        "composite_score": composite_score,
        "priority_tier": tier,
        "weights_used": {"w_condition": w_cond, "w_satellite": w_sat, "w_forecast": w_fc},
        "boundaries_used": {"healthy_max": healthy_max, "monitor_max": monitor_max}
    }
