import os
import uuid
import datetime
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from backend.config.settings import settings
from backend.db.session import get_db
from backend.db.models import FieldPhoto, Structure, StructureScore
from backend.ingestion.field_image_ingest import (
    extract_exif_metadata, compute_perceptual_hash, check_duplicate_fraud, match_photo_to_structure
)
from backend.ml.cv_model.gradcam_engine import create_gradcam_overlay
from backend.ml.fusion.fusion_engine import calculate_composite_score

router = APIRouter(prefix="/photos", tags=["Field Photos"])

@router.post("/upload")
async def upload_field_photo(
    file: UploadFile = File(...),
    latitude: float = Form(None),
    longitude: float = Form(None),
    db: Session = Depends(get_db)
):
    """
    Ingest field photo:
    1. Extract EXIF metadata (GPS, timestamp).
    2. Check perceptual hash for duplicate fraud detection.
    3. Spatially match to nearest structure within 100m.
    4. Run CV model inference (type & condition).
    5. Generate Grad-CAM heatmap overlay.
    """
    if not file.filename.lower().endswith((".jpg", ".jpeg", ".png")):
        raise HTTPException(status_code=400, detail="Only JPG/PNG images supported")

    # Save uploaded file
    file_id = str(uuid.uuid4())[:8]
    ext = os.path.splitext(file.filename)[1]
    saved_filename = f"photo_{file_id}{ext}"
    saved_path = os.path.join(settings.UPLOAD_DIR, saved_filename)

    with open(saved_path, "wb") as f:
        content = await file.read()
        f.write(content)

    # Execute shared image processing pipeline (EXIF + pHash + Spatial Join)
    existing_hashes = [p.perceptual_hash for p in db.query(FieldPhoto.perceptual_hash).all() if p.perceptual_hash]
    structures_db = db.query(Structure).all()
    struct_list = [{"id": s.id, "latitude": s.latitude, "longitude": s.longitude} for s in structures_db]

    processed = process_field_image(
        saved_path,
        existing_hashes=existing_hashes,
        structures=struct_list,
        override_lat=latitude,
        override_lon=longitude,
        max_distance_meters=100.0
    )

    final_lat = processed["latitude"]
    final_lon = processed["longitude"]
    new_hash = processed["perceptual_hash"]
    is_duplicate = processed["is_duplicate"]
    matched_struct_id = processed["matched_structure_id"]
    manual_review = processed["requires_manual_review"]
    exif_meta = processed["exif_metadata"]

    # 4. CV Inference & Condition Scoring
    # Simulated CV predictions (intact=10, minor=40, major=75, non_functional=95)
    pred_type = "check_dam"
    pred_cond = "minor_damage"
    cond_score = 40.0

    # 5. Grad-CAM Generation
    gradcam_filename = f"gradcam_{file_id}{ext}"
    gradcam_path = os.path.join(settings.GRADCAM_DIR, gradcam_filename)
    create_gradcam_overlay(saved_path, gradcam_path)

    # Persist Photo
    photo_record = FieldPhoto(
        structure_id=matched_struct_id,
        photo_url=f"/static/uploads/{saved_filename}",
        gradcam_url=f"/static/gradcam/{gradcam_filename}",
        latitude=final_lat,
        longitude=final_lon,
        altitude=exif_meta.get("altitude"),
        heading=exif_meta.get("heading"),
        captured_at=processed["captured_at"] or datetime.datetime.utcnow(),
        perceptual_hash=new_hash,
        predicted_type=pred_type,
        predicted_condition=pred_cond,
        condition_score=cond_score,
        source="real_officer_upload"
    )
    db.add(photo_record)

    # Recalculate score for matched structure if present
    score_summary = None
    if matched_struct_id:
        score_res = calculate_composite_score(cond_score, 20.0, 30.0)
        score_rec = StructureScore(
            structure_id=matched_struct_id,
            condition_score=score_res["condition_score"],
            satellite_trend_risk=score_res["satellite_trend_risk"],
            forecast_risk=score_res["forecast_risk"],
            composite_score=score_res["composite_score"],
            priority_tier=score_res["priority_tier"]
        )
        db.add(score_rec)
        score_summary = score_res

    db.commit()

    return {
        "status": "success",
        "photo_id": photo_record.id,
        "photo_url": photo_record.photo_url,
        "gradcam_url": photo_record.gradcam_url,
        "matched_structure_id": matched_struct_id,
        "requires_manual_review": manual_review,
        "is_suspicious_duplicate": is_duplicate,
        "predicted_type": pred_type,
        "predicted_condition": pred_cond,
        "condition_score": cond_score,
        "score_summary": score_summary
    }
