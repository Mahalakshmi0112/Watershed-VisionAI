import logging
import random
import datetime
from typing import Dict, Any, List, Optional
from backend.config.settings import settings

logger = logging.getLogger(__name__)

_GEE_INITIALIZED = False

def initialize_gee() -> bool:
    """Initialize Google Earth Engine API if credentials exist."""
    global _GEE_INITIALIZED
    if _GEE_INITIALIZED:
        return True

    if not settings.EE_SERVICE_ACCOUNT or not settings.EE_PRIVATE_KEY_FILE:
        logger.warning("WARNING: GEE credentials missing. Falling back to local synthetic satellite data generator.")
        print("WARNING: GEE credentials missing. Falling back to local synthetic satellite data generator.")
        return False

    try:
        import ee
        credentials = ee.ServiceAccountCredentials(
            settings.EE_SERVICE_ACCOUNT, settings.EE_PRIVATE_KEY_FILE
        )
        ee.Initialize(credentials)
        _GEE_INITIALIZED = True
        logger.info("Google Earth Engine initialized successfully.")
        return True
    except Exception as e:
        logger.warning(f"WARNING: Failed to initialize GEE API ({e}). Falling back to local synthetic satellite data generator.")
        print(f"WARNING: Failed to initialize GEE API ({e}). Falling back to local synthetic satellite data generator.")
        return False

def pull_satellite_indices_for_point(
    lat: float,
    lon: float,
    target_date: Optional[datetime.datetime] = None,
    buffer_meters: float = 100.0
) -> Dict[str, Any]:
    """
    Fetch Sentinel-2 / Landsat NDVI & NDWI indices for given coordinates.
    Returns dict with ndvi, ndwi, observation_date, and data_source ('real' | 'synthetic').
    """
    if target_date is None:
        target_date = datetime.datetime.utcnow()

    is_gee_ready = initialize_gee()

    if is_gee_ready:
        try:
            import ee
            point = ee.Geometry.Point([lon, lat])
            buffer = point.buffer(buffer_meters)
            
            start_date = (target_date - datetime.timedelta(days=15)).strftime("%Y-%m-%d")
            end_date = (target_date + datetime.timedelta(days=15)).strftime("%Y-%m-%d")

            collection = (
                ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
                .filterBounds(buffer)
                .filterDate(start_date, end_date)
                .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 30))
            )

            image = collection.median()
            
            # Compute NDVI & NDWI
            ndvi = image.normalizedDifference(["B8", "B4"]).rename("NDVI")
            ndwi = image.normalizedDifference(["B3", "B8"]).rename("NDWI")

            stats = ndvi.addBands(ndwi).reduceRegion(
                reducer=ee.Reducer.mean(),
                geometry=buffer,
                scale=10,
                maxPixels=1e9
            ).getInfo()

            ndvi_val = float(stats.get("NDVI", 0.45))
            ndwi_val = float(stats.get("NDWI", 0.20))

            return {
                "ndvi": round(ndvi_val, 4),
                "ndwi": round(ndwi_val, 4),
                "observation_date": target_date,
                "data_source": "real"
            }
        except Exception as e:
            logger.warning(f"GEE execution failed ({e}); using synthetic fallback for this cycle.")

    # Synthetic fallback logic
    # Base synthetic generation on pseudo-random hash of lat/lon and target_date to be deterministic
    seed_val = int(abs(lat * 1000 + lon * 1000 + target_date.month * 10))
    random.seed(seed_val)
    
    base_ndvi = 0.40 + random.uniform(-0.15, 0.20)
    base_ndwi = 0.15 + random.uniform(-0.10, 0.15)

    return {
        "ndvi": round(base_ndvi, 4),
        "ndwi": round(base_ndwi, 4),
        "observation_date": target_date,
        "data_source": "synthetic"
    }

def run_satellite_ingestion_cycle(db_session, is_manual: bool = False) -> Dict[str, Any]:
    """
    Ingest a new satellite observation cycle for all registered structures.
    Can be run via scheduled APScheduler job or triggered manually.
    """
    from backend.db.models import Structure, SatelliteObservation

    structures = db_session.query(Structure).all()
    records_added = 0
    synthetic_count = 0
    now = datetime.datetime.utcnow()

    for s in structures:
        result = pull_satellite_indices_for_point(s.latitude, s.longitude, target_date=now)
        
        # If structure is marked synthetic or GEE produced synthetic data
        if result["data_source"] == "synthetic":
            synthetic_count += 1
            s.is_synthetic = True
            db_session.add(s)

        obs = SatelliteObservation(
            structure_id=s.id,
            observation_date=result["observation_date"],
            ndvi=result["ndvi"],
            ndwi=result["ndwi"],
            data_source=result["data_source"]
        )
        db_session.add(obs)
        records_added += 1

    db_session.commit()
    
    mode_str = "Manual" if is_manual else "Scheduled"
    summary = {
        "cycle_type": mode_str,
        "structures_processed": len(structures),
        "records_added": records_added,
        "synthetic_records": synthetic_count,
        "timestamp": now.isoformat()
    }
    logger.info(f"[{mode_str} Satellite Ingestion] Completed: {summary}")
    return summary

if __name__ == "__main__":
    import sys
    from backend.db.session import SessionLocal
    print("Executing manual satellite pull CLI trigger...")
    db = SessionLocal()
    try:
        res = run_satellite_ingestion_cycle(db, is_manual=True)
        print(f"Manual satellite pull completed: {res}")
    finally:
        db.close()
