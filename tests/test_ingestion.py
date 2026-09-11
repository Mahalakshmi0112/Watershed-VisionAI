import os
import pytest
import datetime
from PIL import Image, ImageDraw
from backend.ingestion.field_image_ingest import (
    extract_exif_metadata, compute_perceptual_hash, check_duplicate_fraud, match_photo_to_structure
)
from backend.ingestion.satellite_gee_ingest import pull_satellite_indices_for_point
from backend.ingestion.gis_layer_ingest import parse_geojson_layer

def test_exif_and_phash(tmp_path):
    # Create a dummy image with distinct features
    img_path1 = str(tmp_path / "test_photo1.jpg")
    img1 = Image.new("RGB", (200, 200), color="blue")
    draw1 = ImageDraw.Draw(img1)
    draw1.rectangle([20, 20, 180, 180], fill="yellow")
    img1.save(img_path1)

    img_path2 = str(tmp_path / "test_photo2.jpg")
    img2 = Image.new("RGB", (200, 200), color="red")
    draw2 = ImageDraw.Draw(img2)
    draw2.ellipse([10, 10, 50, 50], fill="green")
    img2.save(img_path2)

    # Test EXIF extraction
    meta = extract_exif_metadata(img_path1)
    assert isinstance(meta, dict)
    assert "latitude" in meta
    assert "longitude" in meta

    # Test perceptual hash
    hash1 = compute_perceptual_hash(img_path1)
    hash2 = compute_perceptual_hash(img_path2)
    assert len(hash1) > 0
    assert len(hash2) > 0

    # Fraud check with identical hash
    is_dup, match = check_duplicate_fraud(hash1, [hash1])
    assert is_dup is True
    assert match == hash1

    # Fraud check with distinct hash
    is_dup2, _ = check_duplicate_fraud(hash2, [hash1])
    assert is_dup2 is False

def test_spatial_matching():
    structures = [
        {"id": 1, "latitude": 19.1864, "longitude": 73.1919},
        {"id": 2, "latitude": 19.1663, "longitude": 73.2368}
    ]

    # Photo close to structure 1 (within 50 meters)
    struct_id, manual_review = match_photo_to_structure(19.1865, 73.1920, structures, max_distance_meters=100.0)
    assert struct_id == 1
    assert manual_review is False

    # Photo far away from both structures (> 10 km)
    far_id, manual_review_far = match_photo_to_structure(19.5000, 73.5000, structures, max_distance_meters=100.0)
    assert far_id is None
    assert manual_review_far is True

def test_satellite_synthetic_fallback():
    # Calling pull without GEE credentials should log warning and return data_source = 'synthetic'
    res = pull_satellite_indices_for_point(19.1864, 73.1919, target_date=datetime.datetime.utcnow())
    assert isinstance(res, dict)
    assert "ndvi" in res
    assert "ndwi" in res
    assert res["data_source"] == "synthetic"  # Confirms synthetic fallback when GEE credentials absent

def test_gis_geojson_parser():
    sample_geojson = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {"name": "Ulhas Sub-Watershed"},
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[[73.1, 19.1], [73.2, 19.1], [73.2, 19.2], [73.1, 19.2], [73.1, 19.1]]]
                }
            }
        ]
    }
    records = parse_geojson_layer(sample_geojson, boundary_type="watershed")
    assert len(records) == 1
    assert records[0]["name"] == "Ulhas Sub-Watershed"
    assert records[0]["boundary_type"] == "watershed"

def test_gis_boundary_persistence_and_api_roundtrip():
    from fastapi.testclient import TestClient
    from backend.main import app
    from backend.api.deps import create_access_token
    from backend.db.session import SessionLocal
    from backend.db.models import GISBoundary

    client = TestClient(app)

    # Real watershed AOI from ISRO/NRSC Bhuvan for Srikakulam IWMP-24 Chinnagora
    polygon_geojson = {
        "type": "Polygon",
        "coordinates": [
            [[83.55, 18.62], [83.68, 18.62], [83.68, 18.75], [83.55, 18.75], [83.55, 18.62]]
        ]
    }

    feature_collection = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {
                    "name": "Srikakulam IWMP-24 Chinnagora",
                    "state": "Andhra Pradesh",
                    "district": "Srikakulam"
                },
                "geometry": polygon_geojson
            }
        ]
    }

    admin_token = create_access_token(data={"sub": "admin", "role": "admin"})
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Ingest via API
    upload_res = client.post("/api/v1/gis/import?boundary_type=watershed", json=feature_collection, headers=headers)
    assert upload_res.status_code == 200
    upload_data = upload_res.json()
    assert upload_data["status"] == "success"

    # Assert the geom column is NOT null after ingestion
    db = SessionLocal()
    try:
        boundary = (
            db.query(GISBoundary)
            .filter(GISBoundary.name == "Srikakulam IWMP-24 Chinnagora")
            .order_by(GISBoundary.id.desc())
            .first()
        )
        assert boundary is not None
        assert boundary.geom is not None  # Assert geom is NOT null
        boundary_id = boundary.id
    finally:
        db.close()

    # Fetch back via new GET endpoint
    get_res = client.get(f"/api/v1/gis/boundaries/{boundary_id}")
    assert get_res.status_code == 200
    feature = get_res.json()

    assert feature["type"] == "Feature"
    assert feature["id"] == boundary_id
    assert feature["properties"]["name"] == "Srikakulam IWMP-24 Chinnagora"
    assert feature["geometry"] is not None
    assert feature["geometry"]["type"] == "Polygon"

    # Assert returned GeoJSON coordinates match input within floating point tolerance
    expected_coords = polygon_geojson["coordinates"]
    actual_coords = feature["geometry"]["coordinates"]

    assert len(actual_coords) == len(expected_coords)
    for exp_ring, act_ring in zip(expected_coords, actual_coords):
        assert len(act_ring) == len(exp_ring)
        for exp_pt, act_pt in zip(exp_ring, act_ring):
            assert pytest.approx(exp_pt[0], abs=1e-5) == act_pt[0]
            assert pytest.approx(exp_pt[1], abs=1e-5) == act_pt[1]

def test_gis_postgis_conversion_roundtrip():
    from shapely.geometry import shape, mapping
    from geoalchemy2.shape import from_shape, to_shape
    from backend.ingestion.gis_layer_ingest import boundary_geom_to_geojson

    polygon_geojson = {
        "type": "Polygon",
        "coordinates": [
            [[83.55, 18.62], [83.68, 18.62], [83.68, 18.75], [83.55, 18.75], [83.55, 18.62]]
        ]
    }
    s = shape(polygon_geojson)
    wkb = from_shape(s, srid=4326)
    geojson_out = boundary_geom_to_geojson(wkb)
    assert geojson_out["type"] == "Polygon"
    assert geojson_out["coordinates"] == mapping(s)["coordinates"]

def test_shared_process_field_image_pipeline(tmp_path):
    from backend.ingestion.field_image_ingest import process_field_image
    
    img_path = str(tmp_path / "shared_test.jpg")
    img = Image.new("RGB", (150, 150), color="orange")
    draw = ImageDraw.Draw(img)
    draw.line([(10, 10), (140, 140)], fill="black", width=4)
    img.save(img_path)

    structures = [{"id": 10, "latitude": 19.1864, "longitude": 73.1919}]
    
    # Near structure with manual GPS override
    res = process_field_image(
        img_path,
        existing_hashes=[],
        structures=structures,
        override_lat=19.1865,
        override_lon=73.1920,
        max_distance_meters=100.0
    )
    assert res["matched_structure_id"] == 10
    assert res["is_duplicate"] is False
    assert len(res["perceptual_hash"]) > 0

    # Test duplicate detection with same hash
    res2 = process_field_image(
        img_path,
        existing_hashes=[res["perceptual_hash"]],
        structures=structures,
        override_lat=19.1865,
        override_lon=73.1920
    )
    assert res2["is_duplicate"] is True

def test_drishti_batch_ingest_summary(tmp_path):
    from backend.ingestion.drishti_batch_ingest import ingest_drishti_batch
    from backend.db.session import SessionLocal
    from backend.db.models import Structure, FieldPhoto

    drishti_dir = tmp_path / "drishti_test_folder"
    drishti_dir.mkdir()

    # Image 1 (Valid image)
    img1_path = str(drishti_dir / "drishti_photo_1.jpg")
    img1 = Image.new("RGB", (120, 120), color="green")
    draw1 = ImageDraw.Draw(img1)
    draw1.rectangle([20, 20, 100, 100], fill="yellow")
    img1.save(img1_path)

    # Image 2 (Duplicate of Image 1)
    img2_path = str(drishti_dir / "drishti_photo_2.jpg")
    img1.save(img2_path)

    db = SessionLocal()
    try:
        # Ensure at least one structure exists
        s = db.query(Structure).first()
        if not s:
            s = Structure(
                code="STR-TEST-001",
                name="Test Check Dam",
                structure_type="check_dam",
                watershed_name="Test Basin",
                latitude=19.1864,
                longitude=73.1919
            )
            db.add(s)
            db.commit()
            db.refresh(s)

        # Ingest batch
        summary = ingest_drishti_batch(str(drishti_dir), db=db, max_distance_meters=100.0)
        assert summary["total_processed"] == 2
        assert "duplicates_skipped" in summary
        assert "unmatched" in summary
        assert "successfully_ingested" in summary
    finally:
        db.close()

