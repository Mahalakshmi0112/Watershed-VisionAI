from typing import Dict, Any
from fastapi import APIRouter, Depends, Body, HTTPException
from sqlalchemy.orm import Session
from backend.db.session import get_db
from backend.api.deps import require_role
from backend.ingestion.gis_layer_ingest import import_gis_layer_to_db

router = APIRouter(prefix="/gis", tags=["GIS Admin"])

@router.post("/import")
def import_gis_layer(
    boundary_type: str = "watershed",
    geojson_payload: Dict[str, Any] = Body(...),
    current_user = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """
    Admin-only endpoint to import versioned GeoJSON GIS layers (boundaries, drainage networks).
    Enforces RBAC: returns 403 for non-admin officers.
    """
    if "features" not in geojson_payload:
        raise HTTPException(status_code=400, detail="Invalid GeoJSON. FeatureCollection required.")

    res = import_gis_layer_to_db(db, geojson_payload, boundary_type=boundary_type)
    res["imported_by"] = current_user.username
    return res
