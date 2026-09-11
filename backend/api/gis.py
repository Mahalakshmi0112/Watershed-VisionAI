from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, Body, HTTPException, Query
from sqlalchemy.orm import Session
from backend.db.session import get_db
from backend.db.models import GISBoundary
from backend.api.deps import require_role
from backend.ingestion.gis_layer_ingest import import_gis_layer_to_db, boundary_to_geojson_feature

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
    if geojson_payload.get("type") == "FeatureCollection":
        normalized_payload = geojson_payload
    elif geojson_payload.get("type") == "Feature":
        normalized_payload = {"type": "FeatureCollection", "features": [geojson_payload]}
    elif "coordinates" in geojson_payload and "type" in geojson_payload:
        normalized_payload = {
            "type": "FeatureCollection",
            "features": [{"type": "Feature", "properties": {}, "geometry": geojson_payload}]
        }
    elif "features" in geojson_payload:
        normalized_payload = geojson_payload
    else:
        raise HTTPException(status_code=400, detail="Invalid GeoJSON. FeatureCollection required.")

    res = import_gis_layer_to_db(db, normalized_payload, boundary_type=boundary_type)
    res["imported_by"] = current_user.username
    return res

@router.get("/boundaries/{boundary_id}")
def get_gis_boundary(
    boundary_id: int,
    db: Session = Depends(get_db)
):
    """
    Retrieve a stored GIS boundary by ID as a standard GeoJSON Feature, including geometry.
    """
    boundary = db.query(GISBoundary).filter(GISBoundary.id == boundary_id).first()
    if not boundary:
        raise HTTPException(status_code=404, detail="GIS boundary not found.")
    return boundary_to_geojson_feature(boundary)

@router.get("/boundaries")
def list_gis_boundaries(
    boundary_type: Optional[str] = None,
    name: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    List stored GIS boundaries as a GeoJSON FeatureCollection.
    """
    query = db.query(GISBoundary)
    if boundary_type:
        query = query.filter(GISBoundary.boundary_type == boundary_type)
    if name:
        query = query.filter(GISBoundary.name.ilike(f"%{name}%"))
    boundaries = query.all()
    return {
        "type": "FeatureCollection",
        "features": [boundary_to_geojson_feature(b) for b in boundaries]
    }
