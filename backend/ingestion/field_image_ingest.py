import os
import datetime
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS
import imagehash
from shapely.geometry import Point
import geopandas as gpd
import pandas as pd
from typing import Dict, Any, Optional, Tuple, List

def _convert_to_degrees(value) -> float:
    """Helper to convert EXIF tuple coordinates (deg, min, sec) to float degrees."""
    d = float(value[0])
    m = float(value[1])
    s = float(value[2])
    return d + (m / 60.0) + (s / 3600.0)

def extract_exif_metadata(image_path: str) -> Dict[str, Any]:
    """
    Extract EXIF metadata from field photo including GPS lat/lon, altitude, heading, timestamp.
    """
    metadata = {
        "latitude": None,
        "longitude": None,
        "altitude": None,
        "heading": None,
        "timestamp": None
    }
    
    try:
        image = Image.open(image_path)
        exif_raw = image._getexif()
        if not exif_raw:
            return metadata

        exif = {}
        for tag, value in exif_raw.items():
            decoded = TAGS.get(tag, tag)
            exif[decoded] = value

        # Timestamp
        if "DateTimeOriginal" in exif:
            try:
                metadata["timestamp"] = datetime.datetime.strptime(
                    exif["DateTimeOriginal"], "%Y:%m:%d %H:%M:%S"
                )
            except Exception:
                pass
        
        # GPS Info
        if "GPSInfo" in exif:
            gps_info = {}
            for t in exif["GPSInfo"]:
                sub_tag = GPSTAGS.get(t, t)
                gps_info[sub_tag] = exif["GPSInfo"][t]

            # Latitude
            if "GPSLatitude" in gps_info and "GPSLatitudeRef" in gps_info:
                lat = _convert_to_degrees(gps_info["GPSLatitude"])
                if gps_info["GPSLatitudeRef"] != "N":
                    lat = -lat
                metadata["latitude"] = round(lat, 6)

            # Longitude
            if "GPSLongitude" in gps_info and "GPSLongitudeRef" in gps_info:
                lon = _convert_to_degrees(gps_info["GPSLongitude"])
                if gps_info["GPSLongitudeRef"] != "E":
                    lon = -lon
                metadata["longitude"] = round(lon, 6)

            # Altitude
            if "GPSAltitude" in gps_info:
                metadata["altitude"] = float(gps_info["GPSAltitude"])

            # Heading (ImgDirection)
            if "GPSImgDirection" in gps_info:
                metadata["heading"] = float(gps_info["GPSImgDirection"])

    except Exception as e:
        print(f"[EXIF Extractor Error] {e}")

    return metadata

def compute_perceptual_hash(image_path: str) -> str:
    """Compute perceptual hash (phash) for fraud/duplicate detection."""
    try:
        img = Image.open(image_path)
        p_hash = imagehash.phash(img)
        return str(p_hash)
    except Exception as e:
        print(f"[pHash Error] {e}")
        return ""

def check_duplicate_fraud(new_hash_str: str, existing_hashes: List[str], max_diff: int = 5) -> Tuple[bool, Optional[str]]:
    """
    Check if the new perceptual hash matches any existing hashes within hamming distance threshold.
    Returns (is_duplicate, matching_hash).
    """
    if not new_hash_str or not existing_hashes:
        return False, None

    try:
        new_h = imagehash.hex_to_hash(new_hash_str)
        for h_str in existing_hashes:
            if not h_str:
                continue
            try:
                existing_h = imagehash.hex_to_hash(h_str)
                if (new_h - existing_h) <= max_diff:
                    return True, h_str
            except Exception:
                # Skip legacy/mock non-hex hashes safely
                continue
    except Exception as e:
        print(f"[Fraud Check Error] {e}")

    return False, None

def match_photo_to_structure(
    lat: Optional[float],
    lon: Optional[float],
    structures: List[Dict[str, Any]],
    max_distance_meters: float = 100.0
) -> Tuple[Optional[int], bool]:
    """
    Spatially match photo coordinates to nearest structure using GeoPandas spatial join / distance.
    Returns (matched_structure_id, requires_manual_review).
    Approximate 1 degree ~ 111,000 meters. 100m ~ 0.0009 degrees.
    """
    if lat is None or lon is None or not structures:
        return None, True  # Missing GPS -> flag for manual review

    # Convert distance to approximate degrees threshold
    max_dist_deg = max_distance_meters / 111000.0

    photo_geom = Point(lon, lat)
    
    struct_df = pd.DataFrame(structures)
    struct_df["geometry"] = struct_df.apply(lambda row: Point(row["longitude"], row["latitude"]), axis=1)
    gdf = gpd.GeoDataFrame(struct_df, geometry="geometry")

    min_dist = float("inf")
    best_id = None

    for idx, row in gdf.iterrows():
        dist = photo_geom.distance(row["geometry"])
        if dist < min_dist:
            min_dist = dist
            best_id = row["id"]

    if min_dist <= max_dist_deg and best_id is not None:
        return best_id, False
    else:
        # Distance exceeded -> unmatched/new structure
        return None, True

def process_field_image(
    image_path: str,
    existing_hashes: List[str],
    structures: List[Dict[str, Any]],
    override_lat: Optional[float] = None,
    override_lon: Optional[float] = None,
    max_distance_meters: float = 100.0,
    phash_max_diff: int = 5
) -> Dict[str, Any]:
    """
    Shared core image processing pipeline:
    1. EXIF metadata extraction (GPS coordinates, altitude, heading, timestamp).
    2. Perceptual hashing (imagehash.phash) & duplicate fraud check.
    3. Spatial point matching to nearest structure within 100 meters.
    
    Both real-time officer uploads (photos.py) and batch DRISHTI imports
    (drishti_batch_ingest.py) call this shared function to avoid duplicating logic.
    """
    exif_meta = extract_exif_metadata(image_path)
    lat = override_lat if override_lat is not None else exif_meta.get("latitude")
    lon = override_lon if override_lon is not None else exif_meta.get("longitude")

    p_hash = compute_perceptual_hash(image_path)
    is_dup, match_hash = check_duplicate_fraud(p_hash, existing_hashes, max_diff=phash_max_diff)

    matched_id, manual_review = match_photo_to_structure(
        lat, lon, structures, max_distance_meters=max_distance_meters
    )

    return {
        "exif_metadata": exif_meta,
        "latitude": lat,
        "longitude": lon,
        "perceptual_hash": p_hash,
        "is_duplicate": is_dup,
        "duplicate_match_hash": match_hash,
        "matched_structure_id": matched_id,
        "requires_manual_review": manual_review,
        "captured_at": exif_meta.get("timestamp")
    }

