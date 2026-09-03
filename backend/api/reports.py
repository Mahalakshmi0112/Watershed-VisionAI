from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.db.session import get_db
from backend.db.models import Structure, StructureScore

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.post("/generate")
def generate_summary_report(
    region: str = Query("All Regions"),
    db: Session = Depends(get_db)
):
    """Generate structured CSV/PDF summary report data for officers."""
    structures = db.query(Structure).all()
    rows = []
    
    healthy_cnt, monitor_cnt, urgent_cnt = 0, 0, 0

    for s in structures:
        latest_score = (
            db.query(StructureScore)
            .filter(StructureScore.structure_id == s.id)
            .order_by(StructureScore.evaluated_at.desc())
            .first()
        )
        tier = latest_score.priority_tier if latest_score else "Healthy"
        score_val = latest_score.composite_score if latest_score else 10.0

        if tier == "Healthy":
            healthy_cnt += 1
        elif tier == "Monitor":
            monitor_cnt += 1
        else:
            urgent_cnt += 1

        rows.append({
            "code": s.code,
            "name": s.name,
            "type": s.structure_type,
            "watershed": s.watershed_name,
            "is_synthetic": s.is_synthetic,
            "score": score_val,
            "priority_tier": tier
        })

    return {
        "report_title": f"Watershed Structure Monitoring & Risk Report ({region})",
        "total_structures": len(structures),
        "tier_summary": {
            "healthy": healthy_cnt,
            "monitor": monitor_cnt,
            "urgent": urgent_cnt
        },
        "records": rows
    }
