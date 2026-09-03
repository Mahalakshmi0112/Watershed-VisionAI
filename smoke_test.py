import sys
import os
sys.path.insert(0, r"C:\Users\Maha\AppData\Roaming\Python\Python314\site-packages")

import datetime
from PIL import Image

def print_step(name: str, passed: bool, details: str = ""):
    status_str = "\033[92m[ PASS ]\033[0m" if passed else "\033[91m[ FAIL ]\033[0m"
    print(f"{status_str} {name} {f'({details})' if details else ''}")

def run_smoke_test():
    print("\n=======================================================")
    print("      WatershedVision-AI — Automated Smoke Test        ")
    print("=======================================================\n")
    
    all_passed = True

    # 1. DB Initialization & Seed
    try:
        from backend.db.session import engine, SessionLocal
        from backend.db.seed import seed_database
        from backend.db.models import Structure, User, FieldPhoto, SatelliteObservation
        
        seed_database()
        db = SessionLocal()
        struct_count = db.query(Structure).count()
        user_count = db.query(User).count()
        
        passed = (struct_count > 0 and user_count >= 2)
        print_step("Step 1: Database Initialization & Seeding", passed, f"Found {struct_count} structures, {user_count} users")
        if not passed: all_passed = False
    except Exception as e:
        print_step("Step 1: Database Initialization & Seeding", False, str(e))
        all_passed = False

    # Instantiate TestClient for API endpoints
    client = None
    try:
        from fastapi.testclient import TestClient
        from backend.main import app
        client = TestClient(app)
    except Exception as e:
        print(f"[Smoke Test Warning] TestClient init failed: {e}")

    # 2. RBAC Route Permission Check
    try:
        from backend.api.deps import create_access_token

        admin_token = create_access_token(data={"sub": "admin", "role": "admin"})
        officer_token = create_access_token(data={"sub": "officer", "role": "officer"})

        # Admin route trigger -> 200 OK
        res_admin = client.post("/api/v1/ingestion/satellite-pull", headers={"Authorization": f"Bearer {admin_token}"})
        # Officer route trigger -> 403 Forbidden
        res_officer = client.post("/api/v1/ingestion/satellite-pull", headers={"Authorization": f"Bearer {officer_token}"})

        rbac_passed = (res_admin.status_code == 200 and res_officer.status_code == 403)
        print_step("Step 2: Role-Based Access Control (RBAC)", rbac_passed, "Admin HTTP 200 OK, Officer HTTP 403 Forbidden")
        if not rbac_passed: all_passed = False
    except Exception as e:
        print_step("Step 2: Role-Based Access Control (RBAC)", False, str(e))
        all_passed = False

    # 3. Field Image Ingestion & Grad-CAM Generation
    try:
        from backend.ingestion.field_image_ingest import extract_exif_metadata, compute_perceptual_hash, match_photo_to_structure
        from backend.ml.cv_model.gradcam_engine import create_gradcam_overlay

        dummy_path = "smoke_sample_photo.jpg"
        dummy_out = "smoke_gradcam_photo.jpg"
        img = Image.new("RGB", (300, 300), color="blue")
        img.save(dummy_path)

        p_hash = compute_perceptual_hash(dummy_path)
        struct_id, manual_review = match_photo_to_structure(19.1864, 73.1919, [{"id": 1, "latitude": 19.1864, "longitude": 73.1919}])
        create_gradcam_overlay(dummy_path, dummy_out)

        img_passed = (len(p_hash) > 0 and struct_id == 1 and os.path.exists(dummy_out))
        print_step("Step 3: Field Photo EXIF, pHash & Grad-CAM Heatmap", img_passed, f"Matched Struct #{struct_id}, Grad-CAM generated")
        
        # Cleanup
        if os.path.exists(dummy_path): os.remove(dummy_path)
        if os.path.exists(dummy_out): os.remove(dummy_out)
        
        if not img_passed: all_passed = False
    except Exception as e:
        print_step("Step 3: Field Photo EXIF, pHash & Grad-CAM Heatmap", False, str(e))
        all_passed = False

    # 4. GEE Satellite Pull & Synthetic Warning Fallback
    try:
        from backend.ingestion.satellite_gee_ingest import pull_satellite_indices_for_point
        sat_res = pull_satellite_indices_for_point(19.1864, 73.1919)
        
        sat_passed = (isinstance(sat_res, dict) and "ndvi" in sat_res and sat_res["data_source"] == "synthetic")
        print_step("Step 4: Satellite Data Puller & Synthetic Fallback Warning", sat_passed, f"NDVI={sat_res['ndvi']}, data_source={sat_res['data_source']}")
        if not sat_passed: all_passed = False
    except Exception as e:
        print_step("Step 4: Satellite Data Puller & Synthetic Fallback Warning", False, str(e))
        all_passed = False

    # 5. Observation-Level Synthetic Data Filtering & Forecast Feature Extraction
    try:
        from backend.ml.forecast_model.feature_engineering import extract_forecast_features_for_structure
        now = datetime.datetime.utcnow()
        mixed_obs = [
            {"observation_date": now - datetime.timedelta(days=90), "ndvi": 0.50, "ndwi": 0.20, "data_source": "real"},
            {"observation_date": now - datetime.timedelta(days=60), "ndvi": 0.45, "ndwi": 0.18, "data_source": "synthetic"},
            {"observation_date": now - datetime.timedelta(days=30), "ndvi": 0.42, "ndwi": 0.15, "data_source": "real"},
            {"observation_date": now, "ndvi": 0.38, "ndwi": 0.12, "data_source": "real"}
        ]
        feats = extract_forecast_features_for_structure({"latitude": 19.18, "longitude": 73.19, "construction_year": 2019}, mixed_obs, condition_score=40.0)
        
        fc_passed = (feats is not None and feats["real_obs_count"] == 3.0)
        print_step("Step 5: Observation-Level Synthetic Data Exclusion", fc_passed, "Filtered synthetic obs, kept 3 real observations for trend calculation")
        if not fc_passed: all_passed = False
    except Exception as e:
        print_step("Step 5: Observation-Level Synthetic Data Exclusion", False, str(e))
        all_passed = False

    # 6. Structure List API `is_synthetic` Flag
    try:
        if client is None:
            raise Exception("TestClient not initialized")
        res_list = client.get("/api/v1/structures")
        structures_list = res_list.json()
        
        list_passed = (res_list.status_code == 200 and len(structures_list) > 0 and "is_synthetic" in structures_list[0])
        print_step("Step 6: Structure List API `is_synthetic` Flag", list_passed, f"GET /api/v1/structures returned is_synthetic={structures_list[0]['is_synthetic']}")
        if not list_passed: all_passed = False
    except Exception as e:
        print_step("Step 6: Structure List API `is_synthetic` Flag", False, str(e))
        all_passed = False

    # 7. Configurable Fusion Scoring & Tier Boundaries
    try:
        from backend.ml.fusion.fusion_engine import calculate_composite_score
        score_res = calculate_composite_score(80.0, 60.0, 70.0)
        
        score_passed = (score_res["composite_score"] == 72.0 and score_res["priority_tier"] == "Urgent")
        print_step("Step 7: Configurable Multi-Criteria Priority Scoring", score_passed, f"Composite Score={score_res['composite_score']}, Priority Tier={score_res['priority_tier']}")
        if not score_passed: all_passed = False
    except Exception as e:
        print_step("Step 7: Configurable Multi-Criteria Priority Scoring", False, str(e))
        all_passed = False

    print("\n=======================================================")
    if all_passed:
        print("  \033[92mSUCCESS: All 7 Smoke Test Steps Passed Cleanly! \033[0m")
        print("=======================================================\n")
        sys.exit(0)
    else:
        print("  \033[91mFAILURE: One or more smoke test steps failed.\033[0m")
        print("=======================================================\n")
        sys.exit(1)

if __name__ == "__main__":
    run_smoke_test()
