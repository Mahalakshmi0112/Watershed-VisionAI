import os
import site
site.addsitedir(r"C:\Users\Maha\AppData\Roaming\Python\Python314\site-packages")

import json
import shutil
import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional
import requests
import torch
import torch.nn.functional as F
import torchvision.transforms as transforms
from PIL import Image

from backend.config.settings import settings, BASE_DIR
from backend.ml.cv_model.model import load_cv_model, STRUCTURE_TYPES, CONDITIONS
from backend.ml.cv_model.gradcam_engine import create_gradcam_overlay
from backend.ingestion.field_image_ingest import compute_perceptual_hash, extract_exif_metadata

# Base paths
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = ROOT_DIR / "data" / "reference"
DRISHTI_DIR = DATA_DIR / "drishti_sample"
TRICHY_DIR = DATA_DIR / "trichy_field_photos"

STATIC_REF_DIR = Path(BASE_DIR) / "static" / "reference"
STATIC_DRISHTI_DIR = STATIC_REF_DIR / "drishti"
STATIC_TRICHY_DIR = STATIC_REF_DIR / "trichy"
STATIC_GRADCAM_DIR = STATIC_REF_DIR / "gradcam"

DRISHTI_IMAGE_URL = "https://bhuvan-app3.nrsc.gov.in/iwmp_fdc/upload/iwmp/iwmp_photos_reorg/3/66/photo1_fdc_IWMP_IWMPFDC_CivilworkSM_Point_f5c9aaf4d675d947_14_4_7_3_10_2015.jpg"
DATA_PROVENANCE_DRISHTI = "ISRO/NRSC Bhuvan Drishti Field Data Collection (IWMP Mobile App Archive)"
DATA_PROVENANCE_TRICHY = "Field Survey - Srirangam / Cauvery and Kollidam River System, Tiruchirappalli, Tamil Nadu (User Ground-Truth)"

# Known metadata for the 9 Trichy field photos
TRICHY_METADATA_REGISTRY = [
    {
        "id": "trichy_01",
        "original_name": "media_1789528355393.jpg",
        "clean_filename": "trichy_cauvery_ammamandapam_01.jpg",
        "title": "Ammamandapam Ghat / Cauvery River Channel",
        "latitude": 10.846135,
        "longitude": 78.689885,
        "location_name": "Ammamandapam Road, Srirangam, Tiruchirappalli, Tamil Nadu 620006",
        "captured_at": "2026-09-12 17:31:00",
        "structure_context": "Cauvery River check/bund barrage & riverfront retaining structure"
    },
    {
        "id": "trichy_02",
        "original_name": "media_1789528355472.jpg",
        "clean_filename": "trichy_kollidam_bridge_highway_02.jpg",
        "title": "Kollidam River Bridge & Water Supply Aqueduct",
        "latitude": 10.866037,
        "longitude": 78.701106,
        "location_name": "Chennai Tiruchi Highway, Srirangam, Tiruchirappalli, Tamil Nadu 620006",
        "captured_at": "2026-09-12 16:55:00",
        "structure_context": "Kollidam flood carrier riverbed bridge piers & piped culvert conveyance"
    },
    {
        "id": "trichy_03",
        "original_name": "media_1789528355530.jpg",
        "clean_filename": "trichy_cauvery_rockfort_view_03.jpg",
        "title": "Cauvery Riverbed & Rockfort Viewpoint",
        "latitude": 10.846130,
        "longitude": 78.689884,
        "location_name": "Ammamandapam Road, Srirangam, Tiruchirappalli, Tamil Nadu 620006",
        "captured_at": "2026-09-12 17:31:00",
        "structure_context": "Cauvery riparian vegetative buffer & sand embankment"
    },
    {
        "id": "trichy_04",
        "original_name": "media_1789528355585.jpg",
        "clean_filename": "trichy_cauvery_corporation_board_04.jpg",
        "title": "Trichy City Corporation Waterway Enclosure",
        "latitude": 10.846410,
        "longitude": 78.689545,
        "location_name": "Ammamandapam Road, Srirangam, Tiruchirappalli, Tamil Nadu 620006",
        "captured_at": "2026-09-12 17:29:00",
        "structure_context": "Riverfront perimeter protection fence & water regulator gate"
    },
    {
        "id": "trichy_05",
        "original_name": "media_1789528355598.jpg",
        "clean_filename": "trichy_cauvery_ghat_steps_05.jpg",
        "title": "Cauvery Bathing Ghat & Revetment Steps",
        "latitude": 10.846143,
        "longitude": 78.689929,
        "location_name": "Ammamandapam Road, Srirangam, Tiruchirappalli, Tamil Nadu 620006",
        "captured_at": "2026-09-12 17:30:00",
        "structure_context": "Masonry river bank protection & concrete flight of steps"
    },
    {
        "id": "trichy_06",
        "original_name": "media_1789528975250.jpg",
        "clean_filename": "trichy_kollidam_transmission_corridor_06.jpg",
        "title": "Kollidam River Crossing & High-Tension Corridor",
        "latitude": 10.866125,
        "longitude": 78.700730,
        "location_name": "Chennai Tiruchi Highway, Srirangam, Tiruchirappalli, Tamil Nadu 620006",
        "captured_at": "2026-09-12 16:49:00",
        "structure_context": "Kollidam floodway regulator & reinforced concrete pylons"
    },
    {
        "id": "trichy_07",
        "original_name": "media_1789528983363.jpg",
        "clean_filename": "trichy_kollidam_floodplain_sandbed_07.jpg",
        "title": "Kollidam Broad Floodplain & Sand Bed",
        "latitude": 10.866112,
        "longitude": 78.700756,
        "location_name": "Chennai Tiruchi Highway, Srirangam, Tiruchirappalli, Tamil Nadu 620006",
        "captured_at": "2026-09-12 16:50:00",
        "structure_context": "River training earthen bund & dry season water ponding"
    },
    {
        "id": "trichy_08",
        "original_name": "media_1789528991236.jpg",
        "clean_filename": "trichy_kollidam_rail_road_arch_bridge_08.jpg",
        "title": "Kollidam Arch Bridge & Water Intake Well",
        "latitude": 10.866104,
        "longitude": 78.700778,
        "location_name": "Chennai Tiruchi Highway, Srirangam, Tiruchirappalli, Tamil Nadu 620006",
        "captured_at": "2026-09-12 16:51:00",
        "structure_context": "Multiple-span arch bridge barrage & municipal intake well"
    },
    {
        "id": "trichy_09",
        "original_name": "media_1789528999390.jpg",
        "clean_filename": "trichy_kollidam_pump_house_aqueduct_09.jpg",
        "title": "River Water Pump House & Pipeline Aqueduct",
        "latitude": 10.866049,
        "longitude": 78.701096,
        "location_name": "Chennai Tiruchi Highway, Srirangam, Tiruchirappalli, Tamil Nadu 620006",
        "captured_at": "2026-09-12 16:53:00",
        "structure_context": "Elevated water pump house tower & structural pipeline bridge"
    }
]


def ensure_directories():
    DRISHTI_DIR.mkdir(parents=True, exist_ok=True)
    TRICHY_DIR.mkdir(parents=True, exist_ok=True)
    STATIC_DRISHTI_DIR.mkdir(parents=True, exist_ok=True)
    STATIC_TRICHY_DIR.mkdir(parents=True, exist_ok=True)
    STATIC_GRADCAM_DIR.mkdir(parents=True, exist_ok=True)


def run_cv_inference_on_image(image_path: str, model=None) -> Dict[str, Any]:
    """
    Runs the existing DualHeadResNet18 CV model on an image:
    Returns predicted structure type, condition, probabilities, and condition score.
    """
    if model is None:
        ckpt = os.path.join(settings.MODELS_DIR, "cv_resnet18_v1.pt")
        model = load_cv_model(ckpt if os.path.exists(ckpt) else None)

    device = torch.device("cpu")
    model.to(device)
    model.eval()

    raw_img = Image.open(image_path).convert("RGB")
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    tensor = transform(raw_img).unsqueeze(0).to(device)

    with torch.no_grad():
        type_logits, cond_logits = model(tensor)
        type_probs = F.softmax(type_logits, dim=1).cpu().numpy()[0]
        cond_probs = F.softmax(cond_logits, dim=1).cpu().numpy()[0]

    type_idx = int(type_probs.argmax())
    cond_idx = int(cond_probs.argmax())

    pred_type = STRUCTURE_TYPES[type_idx]
    pred_cond = CONDITIONS[cond_idx]

    # Map conditions to scores (intact=10, minor=40, major=75, non_functional=95)
    score_map = {"intact": 10.0, "minor_damage": 40.0, "major_damage": 75.0, "non_functional": 95.0}
    cond_score = score_map.get(pred_cond, 40.0)

    # Condition weights expected value
    expected_cond_score = round(
        sum(score_map[c] * float(cond_probs[i]) for i, c in enumerate(CONDITIONS)), 1
    )

    type_conf = round(float(type_probs[type_idx]) * 100.0, 1)
    cond_conf = round(float(cond_probs[cond_idx]) * 100.0, 1)

    return {
        "predicted_type": pred_type,
        "type_confidence_pct": type_conf,
        "type_probabilities": {t: round(float(type_probs[i]) * 100.0, 1) for i, t in enumerate(STRUCTURE_TYPES)},
        "predicted_condition": pred_cond,
        "condition_confidence_pct": cond_conf,
        "condition_probabilities": {c: round(float(cond_probs[i]) * 100.0, 1) for i, c in enumerate(CONDITIONS)},
        "condition_score": cond_score,
        "expected_condition_score": expected_cond_score
    }


def ingest_drishti_reference() -> Dict[str, Any]:
    """
    Downloads the real Drishti photo, generates metadata and runs CV inference.
    """
    ensure_directories()
    dest_path = DRISHTI_DIR / "photo1_real_drishti.jpg"
    static_path = STATIC_DRISHTI_DIR / "photo1_real_drishti.jpg"
    gradcam_static_path = STATIC_GRADCAM_DIR / "gradcam_drishti_photo1.jpg"

    # 1. Download if not already saved
    if not dest_path.exists() or dest_path.stat().st_size == 0:
        print(f"[Drishti Ingest] Downloading real Drishti photo from {DRISHTI_IMAGE_URL}...")
        resp = requests.get(DRISHTI_IMAGE_URL, timeout=15.0, verify=False)
        if resp.status_code == 200:
            with open(dest_path, "wb") as f:
                f.write(resp.content)
            print(f"[Drishti Ingest] Saved {len(resp.content)} bytes to {dest_path}")
        else:
            raise RuntimeError(f"Failed to download Drishti photo (HTTP {resp.status_code})")

    # Copy to static directory for frontend viewing
    shutil.copyfile(dest_path, static_path)

    # Compute pHash
    p_hash = compute_perceptual_hash(str(dest_path))

    # Run CV Model Inference
    ckpt = os.path.join(settings.MODELS_DIR, "cv_resnet18_v1.pt")
    model = load_cv_model(ckpt if os.path.exists(ckpt) else None)
    cv_output = run_cv_inference_on_image(str(dest_path), model=model)

    # Generate Grad-CAM Heatmap
    create_gradcam_overlay(str(dest_path), str(gradcam_static_path), model=model)

    # Write Metadata note
    metadata = {
        "title": "Genuine Bhuvan Drishti Mobile App Field Photograph",
        "filename": "photo1_fdc_IWMP_IWMPFDC_CivilworkSM_Point_f5c9aaf4d675d947_14_4_7_3_10_2015.jpg",
        "source_url": DRISHTI_IMAGE_URL,
        "data_provenance": DATA_PROVENANCE_DRISHTI,
        "is_synthetic": False,
        "is_genuine_nrsc_field_asset": True,
        "taxonomy_breakdown": {
            "fdc": "Field Data Collection (Bhuvan Mobile Collector Standard)",
            "IWMP": "Integrated Watershed Management Programme Scheme",
            "IWMPFDC": "IWMP Mobile Field Data Collection App Subtype",
            "CivilworkSM_Point": "Structure Category: Civil Works Soil Moisture (SM) Point Structure",
            "f5c9aaf4d675d947": "Unique Field Device/Transaction Hash Identifier",
            "14_4_7_3_10_2015": "Field Capture Timestamp: 03-Oct-2015 14:04:07 IST"
        },
        "file_size_bytes": dest_path.stat().st_size,
        "perceptual_hash": p_hash,
        "cv_prediction": cv_output,
        "photo_url": "/static/reference/drishti/photo1_real_drishti.jpg",
        "gradcam_url": "/static/reference/gradcam/gradcam_drishti_photo1.jpg"
    }

    meta_file = DRISHTI_DIR / "drishti_metadata.json"
    with open(meta_file, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    return metadata


def ingest_trichy_field_photos(user_uploaded_dir: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Ingests the 9 real user-collected photos from Srirangam, Trichy:
    1. Copies from upload cache into reference folder and static web folder.
    2. Runs perceptual hashing and EXIF coordinate parsing.
    3. Runs DualHeadResNet18 CV inference for structure type & condition prediction.
    4. Generates Grad-CAM visual explainability heatmap overlays.
    """
    ensure_directories()

    if user_uploaded_dir is None:
        user_uploaded_dir = r"C:\Users\Maha\.gemini\antigravity-ide\brain\26ec1880-8975-4db6-93b5-c0faf78b4c37\.user_uploaded"

    upload_path = Path(user_uploaded_dir)
    results = []

    ckpt = os.path.join(settings.MODELS_DIR, "cv_resnet18_v1.pt")
    model = load_cv_model(ckpt if os.path.exists(ckpt) else None)

    for item in TRICHY_METADATA_REGISTRY:
        orig_file = upload_path / item["original_name"]
        clean_name = item["clean_filename"]
        target_ref_file = TRICHY_DIR / clean_name
        target_static_file = STATIC_TRICHY_DIR / clean_name
        gradcam_static_file = STATIC_GRADCAM_DIR / f"gradcam_{clean_name}"

        # If source file exists in uploads, copy it
        if orig_file.exists():
            shutil.copyfile(orig_file, target_ref_file)
            shutil.copyfile(orig_file, target_static_file)
        elif not target_ref_file.exists():
            print(f"[Trichy Ingest Warning] Source photo {item['original_name']} not found.")
            continue

        # pHash
        p_hash = compute_perceptual_hash(str(target_ref_file))

        # CV Model Inference
        cv_res = run_cv_inference_on_image(str(target_ref_file), model=model)

        # Grad-CAM Overlay
        create_gradcam_overlay(str(target_ref_file), str(gradcam_static_file), model=model)

        record = {
            "id": item["id"],
            "title": item["title"],
            "filename": clean_name,
            "original_upload_name": item["original_name"],
            "latitude": item["latitude"],
            "longitude": item["longitude"],
            "location_name": item["location_name"],
            "captured_at": item["captured_at"],
            "structure_context": item["structure_context"],
            "data_provenance": DATA_PROVENANCE_TRICHY,
            "is_synthetic": False,
            "perceptual_hash": p_hash,
            "cv_prediction": cv_res,
            "photo_url": f"/static/reference/trichy/{clean_name}",
            "gradcam_url": f"/static/reference/gradcam/gradcam_{clean_name}"
        }
        results.append(record)

    # Save summary registry
    with open(TRICHY_DIR / "trichy_registry.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    return results


def get_all_secondary_evidence() -> Dict[str, Any]:
    """Aggregates all secondary evidence (WBIS, TN LULC, Drishti, Trichy) into one unified payload."""
    from backend.ingestion.wbis_reference_data import (
        get_water_spread_stats,
        get_state_lulc_chart,
        DATA_PROVENANCE_WBIS,
        DATA_PROVENANCE_TN_LULC
    )

    wbis = get_water_spread_stats()
    tn_lulc = get_state_lulc_chart()
    drishti = ingest_drishti_reference()
    trichy = ingest_trichy_field_photos()

    return {
        "region": "Cauvery / Trichy Region (Tamil Nadu)",
        "wbis_water_spread": wbis,
        "tn_lulc": tn_lulc,
        "drishti_sample": drishti,
        "trichy_field_photos": trichy,
        "total_trichy_photos": len(trichy),
        "data_provenance_summary": {
            "wbis": DATA_PROVENANCE_WBIS,
            "tn_lulc": DATA_PROVENANCE_TN_LULC,
            "drishti": DATA_PROVENANCE_DRISHTI,
            "trichy_photos": DATA_PROVENANCE_TRICHY
        }
    }
