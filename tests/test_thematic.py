import os
import pytest
from unittest.mock import patch, MagicMock
import requests
from fastapi.testclient import TestClient
from backend.main import app
from backend.ingestion.srishti_reference_data import (
    get_aoi_boundary,
    get_thematic_layer,
    get_lulc_change_stats,
    compute_lulc_changes,
    AOI_BBOX,
    DATA_PROVENANCE
)

client = TestClient(app)


def test_aoi_boundary():
    """Verify AOI polygon matches Srikakulam IWMP-24 Chinnagora."""
    aoi = get_aoi_boundary()
    assert aoi["type"] == "Feature"
    assert aoi["data_provenance"] == DATA_PROVENANCE
    assert "properties" in aoi
    assert aoi["properties"]["bbox"] == AOI_BBOX

    geom = aoi["geometry"]
    assert geom["type"] == "Polygon"
    expected_coords = [
        [[83.55, 18.62], [83.68, 18.62], [83.68, 18.75], [83.55, 18.75], [83.55, 18.62]]
    ]
    assert geom["coordinates"] == expected_coords


def test_thematic_layer_fallback_when_live_fails():
    """
    CRITICAL REQUIREMENT: Mock live HTTP WMS call to fail and assert
    the fallback path returns valid cached image data with source='cached_fallback'.
    """
    with patch("requests.get", side_effect=requests.exceptions.ConnectTimeout("Bhuvan WMS timed out")):
        # Test drainage layer fallback
        drainage = get_thematic_layer("drainage")
        assert drainage["source"] == "cached_fallback"
        assert drainage["data_source"] == "cached_fallback"
        assert len(drainage["image_bytes"]) > 0
        assert drainage["bbox"] == AOI_BBOX
        assert drainage["data_provenance"] == DATA_PROVENANCE
        assert drainage["wms_layer"] == "BDRAIN"

        # Test lulc layer fallback
        lulc = get_thematic_layer("lulc")
        assert lulc["source"] == "cached_fallback"
        assert lulc["data_source"] == "cached_fallback"
        assert len(lulc["image_bytes"]) > 0
        assert lulc["bbox"] == AOI_BBOX
        assert lulc["data_provenance"] == DATA_PROVENANCE
        assert lulc["wms_layer"] == "sisdpv2:AP_Srikakulam_lulc_v2"


def test_lulc_change_stats_fallback_when_live_fails():
    """
    CRITICAL REQUIREMENT: Mock live LULC stats API call to fail and assert
    the fallback path returns valid change stats with source='cached_fallback'
    and top-level data_source showing 'cached_fallback' per year.
    """
    with patch.dict(os.environ, {"BHUVAN_LULC_TOKEN": "mock_test_token_12345"}):
        with patch("requests.get", side_effect=requests.exceptions.HTTPError("Bhuvan 504 Gateway Timeout")):
            stats = get_lulc_change_stats()

            # Provenance and source indicators
            assert stats["data_provenance"] == DATA_PROVENANCE
            assert stats["source"] == "cached_fallback"
            assert stats["data_source"]["2005_06"] == "cached_fallback"
            assert stats["data_source"]["2018_19"] == "cached_fallback"
            assert stats["t0_year"] == "2005_06"
            assert stats["t1_year"] == "2018_19"

            # Check change comparisons
            changes = stats["changes"]
            assert len(changes) == 11

            # Check exact keys in every change item
            for item in changes:
                assert "class" in item
                assert "t0_area_sqkm" in item
                assert "t1_area_sqkm" in item
                assert "change_sqkm" in item
                assert "change_pct" in item

            # Verify known reference calculation for Double/Triple Crop
            double_crop = next(c for c in changes if c["class"] == "Double/Triple Crop")
            assert double_crop["t0_area_sqkm"] == 36.95
            assert double_crop["t1_area_sqkm"] == 71.37
            assert double_crop["change_sqkm"] == 34.42
            assert double_crop["change_pct"] == 93.15


def test_api_thematic_endpoints_with_fallback():
    """
    Test FastAPI endpoints with live HTTP calls mocked to fail.
    Assert responses contain data_provenance, proper headers, and source='cached_fallback'.
    """
    with patch("requests.get", side_effect=requests.exceptions.ConnectionError("Offline mock")):
        # 1. GET /thematic/aoi
        res_aoi = client.get("/api/v1/thematic/aoi")
        assert res_aoi.status_code == 200
        aoi_json = res_aoi.json()
        assert aoi_json["type"] == "Feature"
        assert aoi_json["data_provenance"] == DATA_PROVENANCE
        assert res_aoi.headers.get("X-Data-Provenance") == DATA_PROVENANCE

        # 2. GET /thematic/layers/drainage
        res_drainage = client.get("/api/v1/thematic/layers/drainage")
        assert res_drainage.status_code == 200
        drainage_json = res_drainage.json()
        assert drainage_json["source"] == "cached_fallback"
        assert drainage_json["data_provenance"] == DATA_PROVENANCE
        assert drainage_json["bbox"] == AOI_BBOX
        assert len(drainage_json["image_base64"]) > 0
        assert res_drainage.headers.get("X-Data-Source") == "cached_fallback"
        assert res_drainage.headers.get("X-Data-Provenance") == DATA_PROVENANCE

        # 3. GET /thematic/layers/drainage with raw image output
        res_drainage_raw = client.get("/api/v1/thematic/layers/drainage?raw=true")
        assert res_drainage_raw.status_code == 200
        assert res_drainage_raw.headers.get("content-type") == "image/png"
        assert len(res_drainage_raw.content) > 0
        assert res_drainage_raw.headers.get("X-Data-Source") == "cached_fallback"

        # 4. GET /thematic/layers/lulc
        res_lulc = client.get("/api/v1/thematic/layers/lulc")
        assert res_lulc.status_code == 200
        lulc_json = res_lulc.json()
        assert lulc_json["source"] == "cached_fallback"
        assert lulc_json["data_provenance"] == DATA_PROVENANCE
        assert res_lulc.headers.get("X-Data-Source") == "cached_fallback"

        # 5. GET /thematic/layers/invalid (should return 400)
        res_invalid = client.get("/api/v1/thematic/layers/nonexistent")
        assert res_invalid.status_code == 400

        # 6. GET /thematic/lulc-change
        res_lulc_change = client.get("/api/v1/thematic/lulc-change")
        assert res_lulc_change.status_code == 200
        change_json = res_lulc_change.json()
        assert change_json["source"] == "cached_fallback"
        assert change_json["data_provenance"] == DATA_PROVENANCE
        assert change_json["data_source"]["2005_06"] == "cached_fallback"
        assert change_json["data_source"]["2018_19"] == "cached_fallback"
        assert len(change_json["changes"]) == 11
        assert res_lulc_change.headers.get("X-Data-Source") == "cached_fallback"
        assert res_lulc_change.headers.get("X-Data-Provenance") == DATA_PROVENANCE


def test_live_success_path_mocking():
    """Verify live source flag when live HTTP requests succeed."""
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.headers = {"content-type": "image/png"}
    mock_resp.content = b"\x89PNG\r\n\x1a\n\x00\x00mock_live_image_data"

    with patch("requests.get", return_value=mock_resp):
        res = get_thematic_layer("drainage")
        assert res["source"] == "live"
        assert res["data_source"] == "live"
        assert res["image_bytes"] == mock_resp.content
