from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.db.session import get_db
from backend.db.models import Structure, StructureScore, SatelliteObservation, FieldPhoto
from backend.ml.fusion.fusion_engine import calculate_composite_score
from backend.ml.report.report_generator import generate_officer_summary_report

router = APIRouter(prefix="/structures", tags=["Structures"])

@router.get("")
def list_structures(
    structure_type: Optional[str] = None,
    priority_tier: Optional[str] = None,
    watershed: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    List structures with optional filtering.
    CRITICAL REQUIREMENT: Returns `is_synthetic: boolean` for every structure to allow map markers
    and summary cards to badge synthetic data directly.
    """
    query = db.query(Structure)

    if structure_type:
        query = query.filter(Structure.structure_type == structure_type)
    if watershed:
        query = query.filter(Structure.watershed_name.ilike(f"%{watershed}%"))

    structures = query.all()
    result = []

    for s in structures:
        # Fetch latest score
        latest_score = (
            db.query(StructureScore)
            .filter(StructureScore.structure_id == s.id)
            .order_by(StructureScore.evaluated_at.desc())
            .first()
        )

        tier = latest_score.priority_tier if latest_score else "Healthy"
        comp_score = latest_score.composite_score if latest_score else 10.0

        if priority_tier and tier.lower() != priority_tier.lower():
            continue

        result.append({
            "id": s.id,
            "code": s.code,
            "name": s.name,
            "structure_type": s.structure_type,
            "watershed_name": s.watershed_name,
            "latitude": s.latitude,
            "longitude": s.longitude,
            "construction_year": s.construction_year,
            "is_synthetic": s.is_synthetic,  # Flag for map markers & list badges
            "composite_score": comp_score,
            "priority_tier": tier,
            "updated_at": s.updated_at.isoformat() if s.updated_at else None
        })

    return result

@router.get("/{structure_id}")
def get_structure_detail(structure_id: int, db: Session = Depends(get_db)):
    """Fetch detailed view of single structure including photos, Grad-CAM, satellite series, and report."""
    s = db.query(Structure).filter(Structure.id == structure_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Structure not found")

    # Satellite observations
    obs_list = (
        db.query(SatelliteObservation)
        .filter(SatelliteObservation.structure_id == s.id)
        .order_by(SatelliteObservation.observation_date.asc())
        .all()
    )

    # Photos
    photos = (
        db.query(FieldPhoto)
        .filter(FieldPhoto.structure_id == s.id)
        .order_by(FieldPhoto.captured_at.desc())
        .all()
    )

    # Latest score
    score_rec = (
        db.query(StructureScore)
        .filter(StructureScore.structure_id == s.id)
        .order_by(StructureScore.evaluated_at.desc())
        .first()
    )

    score_dict = {
        "condition_score": score_rec.condition_score if score_rec else 20.0,
        "satellite_trend_risk": score_rec.satellite_trend_risk if score_rec else 15.0,
        "forecast_risk": score_rec.forecast_risk if score_rec else 10.0,
        "composite_score": score_rec.composite_score if score_rec else 15.0,
        "priority_tier": score_rec.priority_tier if score_rec else "Healthy"
    }

    # Structure summary report
    struct_info = {
        "name": s.name, "code": s.code, "structure_type": s.structure_type, "watershed_name": s.watershed_name
    }
    summary_text = generate_officer_summary_report(struct_info, score_dict, {"forecast_risk": score_dict["forecast_risk"]})

    return {
        "id": s.id,
        "code": s.code,
        "name": s.name,
        "structure_type": s.structure_type,
        "watershed_name": s.watershed_name,
        "latitude": s.latitude,
        "longitude": s.longitude,
        "construction_year": s.construction_year,
        "is_synthetic": s.is_synthetic,
        "scores": score_dict,
        "summary_report": summary_text,
        "satellite_series": [
            {
                "id": o.id,
                "observation_date": o.observation_date.isoformat(),
                "ndvi": o.ndvi,
                "ndwi": o.ndwi,
                "data_source": o.data_source
            }
            for o in obs_list
        ],
        "photos": [
            {
                "id": p.id,
                "photo_url": p.photo_url,
                "gradcam_url": p.gradcam_url,
                "captured_at": p.captured_at.isoformat(),
                "predicted_type": p.predicted_type,
                "predicted_condition": p.predicted_condition,
                "condition_score": p.condition_score
            }
            for p in photos
        ]
    }
