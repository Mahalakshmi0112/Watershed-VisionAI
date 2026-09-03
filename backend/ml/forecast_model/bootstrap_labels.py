from typing import Dict, Any, Optional

def generate_weak_supervision_label(
    features: Dict[str, float],
    inspection_outcome: Optional[str] = None
) -> int:
    """
    Generate target label for degradation risk:
    1 = At Risk / Degrading (High risk of failure in 3-12 months)
    0 = Stable / Healthy

    Uses a defensible feedback loop:
    1. If real inspection log exists, use field-verified outcome.
    2. Otherwise, use domain expert heuristic rules.
    """
    # 1. Ground truth from field officer inspection if available
    if inspection_outcome:
        if inspection_outcome in ["major_damage", "non_functional"]:
            return 1
        elif inspection_outcome in ["intact", "minor_damage"]:
            return 0

    # 2. Weak supervision domain heuristic
    ndvi_slope = features.get("ndvi_slope", 0.0)
    cond_score = features.get("condition_score", 0.0)
    age = features.get("structure_age_years", 3.0)

    if (ndvi_slope < -0.0003 and cond_score >= 30.0) or (cond_score >= 65.0) or (age >= 8.0 and ndvi_slope < 0.0):
        return 1
    
    return 0
