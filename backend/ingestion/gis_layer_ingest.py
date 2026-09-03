import json
from typing import Dict, Any, List, Optional
import geopandas as gpd
from shapely.geometry import shape, mapping
from backend.db.models import GISBoundary

def parse_geojson_layer(geojson_data: Dict[str, Any], boundary_type: str = "watershed") -> List[Dict[str, Any]]:
    """
    Parse a GeoJSON FeatureCollection into GISBoundary records.
    Returns list of dicts formatted for DB insertion.
    """
    features = geojson_data.get("features", [])
    records = []

    for idx, f in enumerate(features):
        props = f.get("properties", {})
        name = props.get("name", props.get("NAME", f"Boundary Area #{idx + 1}"))
        geom_dict = f.get("geometry", {})

        records.append({
            "name": name,
            "boundary_type": boundary_type,
            "properties_json": props,
            "geom_geojson": geom_dict
        })

    return records

def import_gis_layer_to_db(db_session, geojson_data: Dict[str, Any], boundary_type: str = "watershed") -> Dict[str, Any]:
    """
    Persist versioned GIS layer boundaries into DB.
    """
    parsed_records = parse_geojson_layer(geojson_data, boundary_type=boundary_type)
    
    # Get current max version for boundary_type
    existing_max_version = (
        db_session.query(GISBoundary.version)
        .filter(GISBoundary.boundary_type == boundary_type)
        .order_by(GISBoundary.version.desc())
        .first()
    )
    next_version = (existing_max_version[0] + 1) if existing_max_version else 1

    imported_count = 0
    for r in parsed_records:
        boundary = GISBoundary(
            name=r["name"],
            boundary_type=r["boundary_type"],
            properties_json=r["properties_json"],
            version=next_version
        )
        db_session.add(boundary)
        imported_count += 1

    db_session.commit()

    return {
        "status": "success",
        "boundary_type": boundary_type,
        "features_imported": imported_count,
        "version": next_version
    }
