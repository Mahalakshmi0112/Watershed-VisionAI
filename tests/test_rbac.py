import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.api.deps import create_access_token

client = TestClient(app)

def test_rbac_admin_vs_officer_access():
    # Generate tokens for admin and officer
    admin_token = create_access_token(data={"sub": "admin", "role": "admin"})
    officer_token = create_access_token(data={"sub": "officer", "role": "officer"})

    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    officer_headers = {"Authorization": f"Bearer {officer_token}"}

    # 1. Admin triggers satellite pull -> HTTP 200 OK
    res_admin = client.post("/api/v1/ingestion/satellite-pull", headers=admin_headers)
    assert res_admin.status_code == 200
    assert res_admin.json()["status"] == "success"

    # 2. Officer triggers satellite pull -> HTTP 403 Forbidden
    res_officer = client.post("/api/v1/ingestion/satellite-pull", headers=officer_headers)
    assert res_officer.status_code == 403
    assert "Operation forbidden" in res_officer.json()["detail"]

    # 3. Officer imports GIS layer -> HTTP 403 Forbidden
    res_gis_officer = client.post(
        "/api/v1/gis/import",
        json={"type": "FeatureCollection", "features": []},
        headers=officer_headers
    )
    assert res_gis_officer.status_code == 403
