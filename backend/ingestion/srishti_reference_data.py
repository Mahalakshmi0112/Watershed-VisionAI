import os
import json
import base64
import urllib.parse
from pathlib import Path
from typing import Dict, Any, List, Optional
import requests
from backend.config.settings import settings

# Directory containing reference data fallback files
REFERENCE_DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "reference" / "srishti_chinnagora"

# Srikakulam IWMP-24 Chinnagora AOI constants
AOI_NAME = "Srikakulam IWMP-24 Chinnagora"
AOI_STATE = "Andhra Pradesh"
AOI_DISTRICT = "Srikakulam"
AOI_WKT = "POLYGON((83.55 18.62, 83.68 18.62, 83.68 18.75, 83.55 18.75, 83.55 18.62))"
AOI_BBOX = [83.55, 18.62, 83.68, 18.75]
DATA_PROVENANCE = "ISRO/NRSC Bhuvan, Srikakulam IWMP-24 Chinnagora AOI"

# Bhuvan API endpoints
WMS_BASE_URL = "https://bhuvan-vec1.nrsc.gov.in/bhuvan/wms"
LULC_API_URL = "https://bhuvan-app1.nrsc.gov.in/api/lulc250k/curl_lulc250k.php"

# Thematic WMS layer definitions
THEMATIC_LAYERS = {
    "drainage": {
        "wms_layer": "BDRAIN",
        "cache_filename": "drainage.png",
        "description": "Drainage network layer from Bhuvan WMS"
    },
    "bdrain": {
        "wms_layer": "BDRAIN",
        "cache_filename": "drainage.png",
        "description": "Drainage network layer from Bhuvan WMS"
    },
    "lulc": {
        "wms_layer": "sisdpv2:AP_Srikakulam_lulc_v2",
        "cache_filename": "lulc_raster.png",
        "description": "Land use / land cover raster from Bhuvan WMS"
    },
    "lulc_raster": {
        "wms_layer": "sisdpv2:AP_Srikakulam_lulc_v2",
        "cache_filename": "lulc_raster.png",
        "description": "Land use / land cover raster from Bhuvan WMS"
    },
    "sisdpv2:ap_srikakulam_lulc_v2": {
        "wms_layer": "sisdpv2:AP_Srikakulam_lulc_v2",
        "cache_filename": "lulc_raster.png",
        "description": "Land use / land cover raster from Bhuvan WMS"
    }
}


def get_aoi_boundary() -> Dict[str, Any]:
    """
    Returns the Srikakulam IWMP-24 Chinnagora AOI polygon as GeoJSON.
    """
    coordinates = [
        [[83.55, 18.62], [83.68, 18.62], [83.68, 18.75], [83.55, 18.75], [83.55, 18.62]]
    ]
    return {
        "type": "Feature",
        "data_provenance": DATA_PROVENANCE,
        "source": "reference_definition",
        "data_source": "reference_definition",
        "properties": {
            "name": AOI_NAME,
            "state": AOI_STATE,
            "district": AOI_DISTRICT,
            "data_provenance": DATA_PROVENANCE,
            "source": "reference_definition",
            "data_source": "reference_definition",
            "bbox": AOI_BBOX
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": coordinates
        }
    }


def get_thematic_layer(layer_name: str) -> Dict[str, Any]:
    """
    Tries a live HTTP GET to the Bhuvan WMS URL for the given layer (5s timeout).
    If it succeeds, saves bytes to disk (overwriting cached file) and returns fresh
    image bytes with source='live'.
    If it fails/times out/errors, falls back to reading matching cached PNG from disk
    and returns it with source='cached_fallback'.
    Always returns real BBOX [83.55, 18.62, 83.68, 18.75] alongside the image.
    """
    key = layer_name.lower().strip()
    if key not in THEMATIC_LAYERS:
        raise ValueError(f"Unknown layer '{layer_name}'. Supported layers: {list(THEMATIC_LAYERS.keys())}")

    layer_info = THEMATIC_LAYERS[key]
    wms_layer = layer_info["wms_layer"]
    cache_path = REFERENCE_DATA_DIR / layer_info["cache_filename"]

    wms_params = {
        "LAYERS": wms_layer,
        "TRANSPARENT": "TRUE",
        "SERVICE": "WMS",
        "VERSION": "1.1.1",
        "REQUEST": "GetMap",
        "STYLES": "",
        "FORMAT": "image/png",
        "SRS": "EPSG:4326",
        "BBOX": f"{AOI_BBOX[0]},{AOI_BBOX[1]},{AOI_BBOX[2]},{AOI_BBOX[3]}",
        "WIDTH": "512",
        "HEIGHT": "512"
    }

    # Attempt live request
    try:
        resp = requests.get(WMS_BASE_URL, params=wms_params, timeout=5.0)
        if resp.status_code == 200 and len(resp.content) > 0 and (
            resp.headers.get("content-type", "").startswith("image") or resp.content.startswith(b"\x89PNG")
        ):
            # Save fresh bytes to disk (overwriting cached file)
            REFERENCE_DATA_DIR.mkdir(parents=True, exist_ok=True)
            with open(cache_path, "wb") as f:
                f.write(resp.content)

            return {
                "image_bytes": resp.content,
                "source": "live",
                "data_source": "live",
                "bbox": AOI_BBOX,
                "layer_name": key,
                "wms_layer": wms_layer,
                "content_type": "image/png",
                "data_provenance": DATA_PROVENANCE
            }
    except Exception:
        # Fall through to cached fallback
        pass

    # Cached fallback path
    if cache_path.exists():
        with open(cache_path, "rb") as f:
            cached_bytes = f.read()

        return {
            "image_bytes": cached_bytes,
            "source": "cached_fallback",
            "data_source": "cached_fallback",
            "bbox": AOI_BBOX,
            "layer_name": key,
            "wms_layer": wms_layer,
            "content_type": "image/png",
            "data_provenance": DATA_PROVENANCE
        }

    raise FileNotFoundError(f"Neither live response nor cached file available for layer '{layer_name}' at {cache_path}")


def compute_lulc_changes(t0_data: List[Dict[str, Any]], t1_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Compute change comparison structure between two years:
    [{"class": ..., "t0_area_sqkm": ..., "t1_area_sqkm": ..., "change_sqkm": ..., "change_pct": ...}]
    """
    d0 = {}
    for item in t0_data:
        desc = item.get("LULC Description", "").strip()
        try:
            area = float(item.get("Area in Sq. Km", 0.0))
        except (ValueError, TypeError):
            area = 0.0
        d0[desc] = area

    d1 = {}
    for item in t1_data:
        desc = item.get("LULC Description", "").strip()
        try:
            area = float(item.get("Area in Sq. Km", 0.0))
        except (ValueError, TypeError):
            area = 0.0
        d1[desc] = area

    all_classes = sorted(list(set(d0.keys()) | set(d1.keys())))
    changes = []
    for cls in all_classes:
        t0_area = d0.get(cls, 0.0)
        t1_area = d1.get(cls, 0.0)
        diff = round(t1_area - t0_area, 2)
        pct = round((diff / t0_area) * 100.0, 2) if t0_area > 0 else 0.0
        changes.append({
            "class": cls,
            "t0_area_sqkm": t0_area,
            "t1_area_sqkm": t1_area,
            "change_sqkm": diff,
            "change_pct": pct
        })

    return changes


import time


def _fetch_year_lulc(year: str, token: str) -> tuple[List[Dict[str, Any]], str]:
    """
    Attempts to fetch LULC stats for a specific year from Bhuvan API with 20s timeout.
    Returns (data, source) where source is 'live' or 'cached_fallback'.
    """
    cache_path = REFERENCE_DATA_DIR / f"lulc_{year}.json"

    # Try live call if token provided
    if token:
        start_time = time.perf_counter()
        try:
            params = {
                "polygon": AOI_WKT,
                "year": year,
                "option": "json",
                "token": token
            }
            resp = requests.get(LULC_API_URL, params=params, timeout=20.0)
            elapsed = round(time.perf_counter() - start_time, 2)
            print(f"[Bhuvan LULC API] Live call for year={year} | HTTP Status: {resp.status_code} | Response Time: {elapsed}s")
            if resp.status_code == 200:
                data = resp.json()
                if isinstance(data, list) and len(data) > 0:
                    return data, "live"
                else:
                    print(f"[Bhuvan LULC API] Year={year} response payload is empty or invalid format: {data}")
            else:
                print(f"[Bhuvan LULC API] Year={year} returned HTTP {resp.status_code} (elapsed {elapsed}s): {resp.text[:120]}")
        except requests.exceptions.Timeout:
            elapsed = round(time.perf_counter() - start_time, 2)
            print(f"[Bhuvan LULC API] Timeout (20.0s) exceeded for year={year} after {elapsed}s")
        except Exception as e:
            elapsed = round(time.perf_counter() - start_time, 2)
            print(f"[Bhuvan LULC API] Call failed for year={year} after {elapsed}s: {type(e).__name__} ({e})")

    # Fallback to cached file
    if cache_path.exists():
        with open(cache_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data, "cached_fallback"

    raise FileNotFoundError(f"No data available for LULC year '{year}' at {cache_path}")


def get_lulc_change_stats() -> Dict[str, Any]:
    """
    For years '2005_06' and '2018_19', tries a live call to LULC stats API using
    BHUVAN_LULC_TOKEN. If live call succeeds, uses that response. If it fails,
    falls back to matching cached JSON file. Computes change comparison structure
    and includes top-level data_source showing whether it was 'live' or 'cached_fallback'.
    """
    token = os.getenv("BHUVAN_LULC_TOKEN", "").strip()

    t0_year = "2005_06"
    t1_year = "2018_19"

    t0_data, t0_source = _fetch_year_lulc(t0_year, token)
    t1_data, t1_source = _fetch_year_lulc(t1_year, token)

    changes = compute_lulc_changes(t0_data, t1_data)

    overall_source = "live" if (t0_source == "live" and t1_source == "live") else "cached_fallback"

    return {
        "data_provenance": DATA_PROVENANCE,
        "source": overall_source,
        "data_source": {
            t0_year: t0_source,
            t1_year: t1_source
        },
        "t0_year": t0_year,
        "t1_year": t1_year,
        "changes": changes,
        "raw_data": {
            t0_year: t0_data,
            t1_year: t1_data
        }
    }
