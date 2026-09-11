import json
from typing import Dict, Any, List, Optional
import geopandas as gpd
from shapely import wkt
from shapely.geometry import shape, mapping
from backend.db.session import IS_SQLITE
from backend.db.models import GISBoundary

def parse_geojson_layer(geojson_data: Dict[str, Any], boundary_type: str = "watershed") -> List[Dict[str, Any]]:
    """
    Parse a GeoJSON FeatureCollection into GISBoundary records.
    Returns list of dicts formatted for DB insertion.
    """
    if geojson_data.get("type") == "Feature":
        features = [geojson_data]
    elif "coordinates" in geojson_data and "type" in geojson_data:
        features = [{"type": "Feature", "properties": {}, "geometry": geojson_data}]
    else:
        features = geojson_data.get("features", [])

    records = []

    for idx, f in enumerate(features):
        props = f.get("properties") or {}
        name = props.get("name", props.get("NAME", f"Boundary Area #{idx + 1}"))
        geom_dict = f.get("geometry", {})
        if not geom_dict and "coordinates" in f:
            geom_dict = f

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

    # Determine if SQLite or PostgreSQL
    is_sqlite = IS_SQLITE
    if db_session is not None:
        try:
            bind = db_session.get_bind()
            if bind is not None and bind.dialect.name == "sqlite":
                is_sqlite = True
            elif bind is not None and bind.dialect.name == "postgresql":
                is_sqlite = False
        except Exception:
            pass

    imported_count = 0
    created_boundaries = []
    for r in parsed_records:
        geom_val = None
        geom_dict = r.get("geom_geojson")
        if geom_dict:
            try:
                geom_shape = shape(geom_dict)
                if is_sqlite:
                    # SQLite fallback: store geometry as WKT text
                    geom_val = geom_shape.wkt
                else:
                    # Postgres/PostGIS: convert to WKBElement via geoalchemy2.shape.from_shape
                    from geoalchemy2.shape import from_shape
                    geom_val = from_shape(geom_shape, srid=4326)
            except Exception:
                geom_val = None

        boundary = GISBoundary(
            name=r["name"],
            boundary_type=r["boundary_type"],
            geom=geom_val,
            properties_json=r["properties_json"],
            version=next_version
        )
        db_session.add(boundary)
        created_boundaries.append(boundary)
        imported_count += 1

    db_session.commit()
    for b in created_boundaries:
        try:
            db_session.refresh(b)
        except Exception:
            pass

    return {
        "status": "success",
        "boundary_type": boundary_type,
        "features_imported": imported_count,
        "version": next_version,
        "boundary_ids": [b.id for b in created_boundaries]
    }

def boundary_geom_to_geojson(geom: Any) -> Optional[Dict[str, Any]]:
    """
    Convert a stored GISBoundary geometry (WKT text in SQLite or WKBElement in PostGIS)
    back to a standard GeoJSON geometry dict.
    """
    if geom is None:
        return None

    # SQLite fallback: stored as WKT text
    if isinstance(geom, str):
        try:
            shape_obj = wkt.loads(geom)
            return mapping(shape_obj)
        except Exception:
            return None

    # PostGIS GeoAlchemy2 WKBElement
    try:
        from geoalchemy2.shape import to_shape
        shape_obj = to_shape(geom)
        return mapping(shape_obj)
    except Exception:
        pass

    # Shapely geometry or object with __geo_interface__
    if hasattr(geom, "__geo_interface__"):
        return mapping(geom)

    return None

def boundary_to_geojson_feature(boundary: GISBoundary) -> Dict[str, Any]:
    """
    Convert a GISBoundary ORM model instance into a GeoJSON Feature dictionary.
    """
    props = dict(boundary.properties_json or {})
    props.update({
        "id": boundary.id,
        "name": boundary.name,
        "boundary_type": boundary.boundary_type,
        "version": boundary.version,
        "created_at": boundary.created_at.isoformat() if boundary.created_at else None
    })

    geom_dict = boundary_geom_to_geojson(boundary.geom)

    return {
        "type": "Feature",
        "id": boundary.id,
        "geometry": geom_dict,
        "properties": props
    }
