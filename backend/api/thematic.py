import base64
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, Response
from backend.ingestion.srishti_reference_data import (
    get_aoi_boundary,
    get_thematic_layer,
    get_lulc_change_stats,
    DATA_PROVENANCE,
    THEMATIC_LAYERS
)

router = APIRouter(prefix="/thematic", tags=["Thematic Reference Data"])


@router.get("/aoi")
def get_aoi(response: Response):
    """
    Retrieve the Srikakulam IWMP-24 Chinnagora watershed boundary as a GeoJSON Feature.
    Includes data provenance and source indicators.
    """
    aoi_data = get_aoi_boundary()
    response.headers["X-Data-Provenance"] = aoi_data["data_provenance"]
    response.headers["X-Data-Source"] = aoi_data["source"]
    return aoi_data


@router.get("/layers/{layer_name}")
def get_layer(
    layer_name: str,
    response: Response,
    format: Optional[str] = Query(None, description="Output format: 'json' (default, base64) or 'image'/'raw'"),
    raw: bool = Query(False, description="Set True to return raw PNG image directly")
):
    """
    Fetch a thematic layer (e.g. 'drainage' or 'lulc') for the Srikakulam AOI.
    Attempts live Bhuvan WMS fetch, falling back to cached reference PNG.
    Returns metadata + base64 image (or raw PNG if requested) with data provenance.
    """
    norm_layer = layer_name.lower().strip()
    if norm_layer not in THEMATIC_LAYERS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid layer '{layer_name}'. Supported layers: 'drainage', 'lulc'"
        )

    try:
        layer_data = get_thematic_layer(norm_layer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # Set provenance headers on every response
    response.headers["X-Data-Provenance"] = layer_data["data_provenance"]
    response.headers["X-Data-Source"] = layer_data["source"]
    response.headers["X-BBOX"] = ",".join(str(x) for x in layer_data["bbox"])

    if raw or (format and format.lower() in ("image", "raw", "png")):
        return Response(
            content=layer_data["image_bytes"],
            media_type="image/png",
            headers={
                "X-Data-Provenance": layer_data["data_provenance"],
                "X-Data-Source": layer_data["source"],
                "X-BBOX": ",".join(str(x) for x in layer_data["bbox"])
            }
        )

    image_b64 = base64.b64encode(layer_data["image_bytes"]).decode("utf-8")

    return {
        "layer_name": layer_data["layer_name"],
        "wms_layer": layer_data["wms_layer"],
        "source": layer_data["source"],
        "data_source": layer_data["data_source"],
        "data_provenance": layer_data["data_provenance"],
        "bbox": layer_data["bbox"],
        "content_type": layer_data["content_type"],
        "image_base64": image_b64,
        "image_url": f"/api/v1/thematic/layers/{norm_layer}/image"
    }


@router.get("/layers/{layer_name}/image")
def get_layer_image(layer_name: str):
    """
    Directly returns raw PNG image bytes for thematic layer.
    """
    norm_layer = layer_name.lower().strip()
    if norm_layer not in THEMATIC_LAYERS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid layer '{layer_name}'. Supported layers: 'drainage', 'lulc'"
        )

    try:
        layer_data = get_thematic_layer(norm_layer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return Response(
        content=layer_data["image_bytes"],
        media_type="image/png",
        headers={
            "X-Data-Provenance": layer_data["data_provenance"],
            "X-Data-Source": layer_data["source"],
            "X-BBOX": ",".join(str(x) for x in layer_data["bbox"])
        }
    )


@router.get("/lulc-change")
def get_lulc_change(response: Response):
    """
    Compute Land Use / Land Cover (LULC) changes for Srikakulam IWMP-24 Chinnagora
    between 2005_06 and 2018_19.
    Attempts live Bhuvan API call with token, falling back to cached reference snapshots.
    Includes data_provenance and per-year data_source fields.
    """
    try:
        stats = get_lulc_change_stats()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    response.headers["X-Data-Provenance"] = stats["data_provenance"]
    response.headers["X-Data-Source"] = stats["source"]

    return stats


@router.get("/lulc-clusters")
def get_lulc_clusters(response: Response):
    """
    Run unsupervised K-Means clustering (k=3) on the 11 real LULC classes for the
    Srikakulam IWMP-24 Chinnagora AOI. Categorizes classes into 'expanding',
    'stable', and 'declining' based on sorted mean change_pct.
    """
    try:
        from backend.ml.lulc_clustering import run_lulc_clustering
        clusters = run_lulc_clustering()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    response.headers["X-Data-Provenance"] = DATA_PROVENANCE
    return {
        "data_provenance": DATA_PROVENANCE,
        "clusters": clusters,
        "total_classes": len(clusters)
    }

