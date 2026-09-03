import site
import sys
site.addsitedir(r"C:\Users\Maha\AppData\Roaming\Python\Python314\site-packages")

import os
import shutil
import uuid
import logging
import argparse
import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from PIL import Image

from backend.config.settings import settings, BASE_DIR
from backend.db.session import SessionLocal
from backend.db.models import FieldPhoto, Structure
from backend.ingestion.field_image_ingest import process_field_image
from backend.ml.cv_model.gradcam_engine import create_gradcam_overlay

# Set up logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("DRISHTI_Ingest")

def ingest_drishti_batch(
    folder_path: str,
    db: Optional[Session] = None,
    max_distance_meters: float = 100.0
) -> Dict[str, Any]:
    """
    Batch DRISHTI photo ingestion script:
    1. Loops over local folder of downloaded DRISHTI geo-tagged images.
    2. Calls shared process_field_image() for EXIF extraction, pHash duplicate fraud check,
       and 100m spatial join to nearest structure.
    3. Skips duplicates (logs match).
    4. Records unmatched photos where no structure exists within max_distance_meters.
    5. Ingests matched valid photos, saves image + Grad-CAM overlay, and tags record:
       source = 'drishti_import'.
    6. Logs and returns batch summary.
    """
    if not os.path.exists(folder_path):
        raise FileNotFoundError(f"DRISHTI images directory not found: {folder_path}")

    close_db_on_exit = False
    if db is None:
        db = SessionLocal()
        close_db_on_exit = True

    summary = {
        "folder_path": folder_path,
        "total_processed": 0,
        "duplicates_skipped": 0,
        "unmatched": 0,
        "successfully_ingested": 0,
        "ingested_photo_ids": []
    }

    try:
        # 1. Fetch existing hashes for duplicate detection
        existing_hashes = [
            p.perceptual_hash for p in db.query(FieldPhoto.perceptual_hash).all() if p.perceptual_hash
        ]

        # 2. Fetch known structures for spatial matching
        structures_db = db.query(Structure).all()
        struct_list = [
            {"id": s.id, "latitude": s.latitude, "longitude": s.longitude, "structure_type": s.structure_type}
            for s in structures_db
        ]
        struct_map = {s["id"]: s for s in struct_list}

        # 3. Discover all image files
        valid_extensions = (".jpg", ".jpeg", ".png")
        image_files = [
            f for f in os.listdir(folder_path)
            if f.lower().endswith(valid_extensions)
        ]

        logger.info(f"[DRISHTI Ingestion] Found {len(image_files)} image candidate(s) in {folder_path}")

        for filename in sorted(image_files):
            summary["total_processed"] += 1
            src_path = os.path.join(folder_path, filename)

            # Call shared image processing pipeline
            processed = process_field_image(
                image_path=src_path,
                existing_hashes=existing_hashes,
                structures=struct_list,
                max_distance_meters=max_distance_meters
            )

            # Check duplicate fraud
            if processed["is_duplicate"]:
                summary["duplicates_skipped"] += 1
                logger.info(
                    f"[DRISHTI Ingestion] Skipped duplicate: {filename} "
                    f"(matches existing hash {processed['duplicate_match_hash']})"
                )
                continue

            # Check spatial match
            matched_id = processed["matched_structure_id"]
            if matched_id is None:
                summary["unmatched"] += 1
                logger.warning(
                    f"[DRISHTI Ingestion] Unmatched photo (no structure within {max_distance_meters}m): {filename} "
                    f"at GPS ({processed['latitude']}, {processed['longitude']})"
                )
                continue

            # Valid matched DRISHTI photo -> save and persist
            file_uuid = str(uuid.uuid4())[:8]
            ext = os.path.splitext(filename)[1]
            dest_filename = f"drishti_{file_uuid}{ext}"
            dest_path = os.path.join(settings.UPLOAD_DIR, dest_filename)

            os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
            shutil.copyfile(src_path, dest_path)

            # Generate Grad-CAM explainability heatmap overlay
            gradcam_filename = f"gradcam_drishti_{file_uuid}{ext}"
            gradcam_path = os.path.join(settings.GRADCAM_DIR, gradcam_filename)
            os.makedirs(settings.GRADCAM_DIR, exist_ok=True)
            create_gradcam_overlay(dest_path, gradcam_path)

            pred_type = struct_map[matched_id]["structure_type"] if matched_id in struct_map else "check_dam"

            photo_record = FieldPhoto(
                structure_id=matched_id,
                photo_url=f"/static/uploads/{dest_filename}",
                gradcam_url=f"/static/gradcam/{gradcam_filename}",
                latitude=processed["latitude"],
                longitude=processed["longitude"],
                altitude=processed["exif_metadata"].get("altitude"),
                heading=processed["exif_metadata"].get("heading"),
                captured_at=processed["captured_at"] or datetime.datetime.utcnow(),
                perceptual_hash=processed["perceptual_hash"],
                predicted_type=pred_type,
                predicted_condition="minor_damage",
                condition_score=35.0,
                source="drishti_import"  # Explicitly tag source as drishti_import
            )
            db.add(photo_record)
            db.flush()

            # Add to local hash cache so intra-batch duplicates are also caught
            if processed["perceptual_hash"]:
                existing_hashes.append(processed["perceptual_hash"])

            summary["successfully_ingested"] += 1
            summary["ingested_photo_ids"].append(photo_record.id)
            logger.info(
                f"[DRISHTI Ingestion] Ingested {filename} -> Structure #{matched_id} "
                f"(source='drishti_import', photo_id={photo_record.id})"
            )

        db.commit()

        # Final structured log summary
        logger.info(
            f"[DRISHTI Ingestion Summary] "
            f"Total processed: {summary['total_processed']} | "
            f"Duplicates skipped: {summary['duplicates_skipped']} | "
            f"Unmatched (no structure within {max_distance_meters}m): {summary['unmatched']} | "
            f"Successfully ingested: {summary['successfully_ingested']}"
        )

    except Exception as e:
        db.rollback()
        logger.error(f"[DRISHTI Ingestion Error] Batch processing failed: {e}", exc_info=True)
        raise
    finally:
        if close_db_on_exit:
            db.close()

    return summary

def create_sample_drishti_dataset(sample_dir: str):
    """Utility to create sample DRISHTI photos with embedded GPS EXIF tags for testing."""
    os.makedirs(sample_dir, exist_ok=True)
    from PIL import ImageDraw, ExifTags

    # Sample 1: Near Ambernath Check Dam (19.1864, 73.1919) -> Should MATCH
    img1 = Image.new("RGB", (200, 200), color="darkgreen")
    draw1 = ImageDraw.Draw(img1)
    draw1.rectangle([30, 30, 170, 170], fill="brown")
    exif1 = img1.getexif()
    gps1 = exif1.get_ifd(ExifTags.IFD.GPSInfo)
    gps1[1] = "N"
    gps1[2] = (19, 11, 11.04)  # 19.1864 N
    gps1[3] = "E"
    gps1[4] = (73, 11, 30.84)  # 73.1919 E
    img1.save(os.path.join(sample_dir, "drishti_checkdam_near.jpg"), exif=exif1)

    # Sample 2: Duplicate of Sample 1 -> Should be SKIPPED as duplicate
    img1.save(os.path.join(sample_dir, "drishti_checkdam_duplicate.jpg"), exif=exif1)

    # Sample 3: Far away coordinate (12.0, 77.0) -> Should be UNMATCHED (>100m)
    img3 = Image.new("RGB", (200, 200), color="blue")
    draw3 = ImageDraw.Draw(img3)
    draw3.ellipse([40, 40, 160, 160], fill="cyan")
    exif3 = img3.getexif()
    gps3 = exif3.get_ifd(ExifTags.IFD.GPSInfo)
    gps3[1] = "N"
    gps3[2] = (12, 0, 0.0)
    gps3[3] = "E"
    gps3[4] = (77, 0, 0.0)
    img3.save(os.path.join(sample_dir, "drishti_far_away_unmatched.jpg"), exif=exif3)

    logger.info(f"[DRISHTI Ingestion] Generated sample test images with GPS EXIF in {sample_dir}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Batch Ingestion for ISRO/NRSC Bhuvan DRISHTI Geo-tagged Field Photos")
    parser.add_argument("--folder", type=str, default=None, help="Local directory containing DRISHTI field photos")
    parser.add_argument("--max-distance", type=float, default=100.0, help="Max distance in meters to match structure")
    args = parser.parse_args()

    target_folder = args.folder
    if not target_folder:
        target_folder = os.path.join(str(BASE_DIR), "data", "drishti_samples")
        if not os.path.exists(target_folder) or not os.listdir(target_folder):
            create_sample_drishti_dataset(target_folder)

    res = ingest_drishti_batch(target_folder, max_distance_meters=args.max_distance)
    print("\nResult Summary:")
    for k, v in res.items():
        print(f"  {k}: {v}")
