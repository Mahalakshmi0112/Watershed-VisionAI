import pytest
from unittest.mock import patch, MagicMock
import requests
from backend.ingestion.wbis_reference_data import get_water_spread_stats, WBIS_FALLBACK_DATA, process_wbis_records

def test_wbis_fallback_when_live_fails():
    """
    Test fallback logic when Bhuvan WBIS API request fails or times out.
    Verifies that verified cached fallback data is returned with source='cached_fallback'
    and capacity utilization % is accurately calculated for each size class.
    """
    with patch("requests.get", side_effect=requests.exceptions.Timeout("Connection timed out")):
        res = get_water_spread_stats(basin="Cauvery Basin", month="aug_2026")

        assert res["source"] == "cached_fallback"
        assert res["basin"] == "Cauvery Basin"
        assert res["month"] == "aug_2026"
        assert "ISRO/NRSC Bhuvan Water Bodies Information System" in res["data_provenance"]
        
        # Check totals
        assert res["total_water_bodies"] == 4185
        assert res["current_water_bodies"] == 3677
        assert res["total_max_area_sqkm"] == 2191.83
        assert res["current_actual_area_sqkm"] == 269.25
        assert res["overall_capacity_utilization_pct"] == 12.28
        assert res["water_bodies_active_pct"] == 87.9

        # Check category capacity utilization % calculations
        categories = res["categories"]
        assert len(categories) == 3

        # Cat 10: 74.1175 / 969.2047 * 100 = ~7.65%
        cat_10 = next(c for c in categories if c["area_code"] == "10")
        assert cat_10["total_water_bodies"] == 3985
        assert cat_10["current_water_bodies"] == 3504
        assert cat_10["capacity_utilization_pct"] == 7.65

        # Cat 100: 78.5853 / 522.9373 * 100 = ~15.03%
        cat_100 = next(c for c in categories if c["area_code"] == "100")
        assert cat_100["total_water_bodies"] == 193
        assert cat_100["current_water_bodies"] == 166
        assert cat_100["capacity_utilization_pct"] == 15.03

        # Cat 5000: 116.5427 / 699.6831 * 100 = ~16.66%
        cat_5000 = next(c for c in categories if c["area_code"] == "5000")
        assert cat_5000["total_water_bodies"] == 7
        assert cat_5000["current_water_bodies"] == 7
        assert cat_5000["capacity_utilization_pct"] == 16.66

def test_wbis_live_success():
    """
    Test successful live API parsing when Bhuvan WBIS API returns valid JSON.
    """
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = WBIS_FALLBACK_DATA

    with patch("requests.get", return_value=mock_resp):
        res = get_water_spread_stats(basin="Cauvery Basin", month="aug_2026")
        assert res["source"] == "live"
        assert res["total_water_bodies"] == 4185
        assert len(res["categories"]) == 3
