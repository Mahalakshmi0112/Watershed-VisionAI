import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_list_structures_includes_is_synthetic():
    response = client.get("/api/v1/structures")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    
    # CRITICAL REQUIREMENT: verify is_synthetic is returned in structure list objects
    for item in data:
        assert "is_synthetic" in item
        assert isinstance(item["is_synthetic"], bool)
        assert "composite_score" in item
        assert "priority_tier" in item

def test_structure_detail():
    structures = client.get("/api/v1/structures").json()
    first_id = structures[0]["id"]

    res = client.get(f"/api/v1/structures/{first_id}")
    assert res.status_code == 200
    detail = res.json()
    assert detail["id"] == first_id
    assert "is_synthetic" in detail
    assert "scores" in detail
    assert "summary_report" in detail
    assert "satellite_series" in detail

def test_reports_endpoint():
    res = client.post("/api/v1/reports/generate?region=Ulhas%20Basin")
    assert res.status_code == 200
    report_data = res.json()
    assert "report_title" in report_data
    assert "tier_summary" in report_data
    assert len(report_data["records"]) > 0
