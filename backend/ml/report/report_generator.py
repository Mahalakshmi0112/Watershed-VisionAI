from typing import Dict, Any, Optional

def generate_officer_summary_report(
    structure_info: Dict[str, Any],
    score_info: Dict[str, Any],
    forecast_info: Dict[str, Any],
    llm_api_key: Optional[str] = None
) -> str:
    """
    Generate plain-English summary paragraph for officers.
    Isolated report module with rule-based fallback if external LLM key is absent.
    """
    name = structure_info.get("name", "Watershed Structure")
    code = structure_info.get("code", "STR-001")
    s_type = structure_info.get("structure_type", "check_dam").replace("_", " ").title()
    watershed = structure_info.get("watershed_name", "Local Watershed")
    
    tier = score_info.get("priority_tier", "Healthy")
    comp_score = score_info.get("composite_score", 0.0)
    cond_score = score_info.get("condition_score", 0.0)
    fc_risk = score_info.get("forecast_risk", 0.0)

    # Isolated fallback rule-based template
    summary = (
        f"{name} ({code}), a {s_type} located in the {watershed}, currently holds a priority score of {comp_score}/100 "
        f"and is classified in the '{tier}' tier. Image classification indicates a structural condition score of {cond_score}/100. "
        f"Time-series degradation forecasting indicates a {fc_risk}% likelihood of future structural failure over the next 6–12 months. "
    )

    if tier == "Urgent":
        summary += "IMMEDIATE FIELD INSPECTION RECOMMENDED: High degradation risk detected along with visible structural wear."
    elif tier == "Monitor":
        summary += "ROUTINE MONITORING RECOMMENDED: Structure exhibits minor wear or declining satellite vegetation indices."
    else:
        summary += "CONDITION SATISFACTORY: Structure remains functionally sound with stable environmental impact indices."

    return summary
