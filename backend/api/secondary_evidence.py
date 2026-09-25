from fastapi import APIRouter, HTTPException, Query, Response
from typing import Optional, Dict, Any, List
from backend.ingestion.wbis_reference_data import (
    get_water_spread_stats,
    get_state_lulc_chart,
    DATA_PROVENANCE_WBIS,
    DATA_PROVENANCE_TN_LULC
)
from backend.ingestion.cauvery_trichy_evidence import (
    ingest_drishti_reference,
    ingest_trichy_field_photos,
    get_all_secondary_evidence,
    DATA_PROVENANCE_DRISHTI,
    DATA_PROVENANCE_TRICHY
)

router = APIRouter(prefix="/secondary-evidence", tags=["Secondary Evidence: Cauvery/Trichy"])


@router.get("/summary")
def get_secondary_evidence_summary(response: Response):
    """
    Returns unified summary payload of all Cauvery/Trichy secondary evidence:
    - WBIS Water Body spread stats & capacity utilization
    - Tamil Nadu LULC 1:50,000 thematic chart & class breakdown
    - Real Drishti field photo reference & taxonomy analysis
    - 9 User-collected real field photos with GPS tags & CV classifications
    """
    try:
        data = get_all_secondary_evidence()
        response.headers["X-Region"] = "Cauvery-Trichy-Tamil-Nadu"
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate secondary evidence summary: {str(e)}")


@router.get("/wbis-water-spread")
def get_wbis_water_spread(
    response: Response,
    basin: str = Query("Cauvery Basin", description="River Basin Name"),
    month: str = Query("aug_2026", description="Evaluation Month Code")
):
    """
    Fetches live WBIS Water Spread statistics from Bhuvan for Cauvery Basin with fallback.
    Computes capacity utilization percentages per size category (<10 Ha, 10-100 Ha, >100 Ha).
    """
    try:
        data = get_water_spread_stats(basin=basin, month=month)
        response.headers["X-Data-Provenance"] = data["data_provenance"]
        response.headers["X-Data-Source"] = data["source"]
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch WBIS stats: {str(e)}")


@router.get("/tn-lulc")
def get_tn_lulc(
    response: Response,
    state_code: str = Query("TN", description="State Code (e.g. TN for Tamil Nadu)"),
    year: str = Query("1516", description="Year code (e.g. 1516 for 2015-16)")
):
    """
    Fetches real Tamil Nadu LULC Thematic reference data (chart image & class table) from Bhuvan.
    """
    try:
        data = get_state_lulc_chart(state_code=state_code, year=year)
        response.headers["X-Data-Provenance"] = data["data_provenance"]
        response.headers["X-Data-Source"] = data["source"]
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch TN LULC data: {str(e)}")


@router.get("/drishti-sample")
def get_drishti_sample(response: Response):
    """
    Returns the real verified Drishti field photo metadata, decoded filename taxonomy,
    and actual CV model inference predictions.
    """
    try:
        data = ingest_drishti_reference()
        response.headers["X-Data-Provenance"] = data["data_provenance"]
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load Drishti reference sample: {str(e)}")


@router.get("/trichy-photos")
def get_trichy_photos(response: Response):
    """
    Returns the 9 real user-collected field photos taken near Srirangam/Trichy,
    complete with GPS coordinates, timestamps, and actual CV model predictions.
    """
    try:
        photos = ingest_trichy_field_photos()
        response.headers["X-Data-Provenance"] = DATA_PROVENANCE_TRICHY
        return {
            "region": "Cauvery & Kollidam River System, Tiruchirappalli, Tamil Nadu",
            "data_provenance": DATA_PROVENANCE_TRICHY,
            "total_photos": len(photos),
            "photos": photos
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load Trichy field photos: {str(e)}")
