import os
import site
site.addsitedir(r"C:\Users\Maha\AppData\Roaming\Python\Python314\site-packages")

import json
import base64
import urllib.parse
import re
from typing import Dict, Any, List, Optional
import requests

WBIS_BASE_URL = "https://bhuvan.nrsc.gov.in/wbisv2/getwsp/hydro"
THEMATIC_CHART_URL = "https://bhuvan-app1.nrsc.gov.in/thematic/thematic/usertasks/download1/chart.php"
THEMATIC_STATS_URL = "https://bhuvan-app1.nrsc.gov.in/thematic/thematic/usertasks/download1/theme_stats/lulc_lulc503.php"

WBIS_FALLBACK_DATA = [
    {
        "total_water_bodies": "3985",
        "total_max_area": 969.2047198425174,
        "current_water_bodies": "3504",
        "current_actual_area": 74.11753243025396,
        "current_max_area": "862.2098389420952900000",
        "area": "10",
        "month": "aug_2026"
    },
    {
        "total_water_bodies": "193",
        "total_max_area": 522.9373385746039,
        "current_water_bodies": "166",
        "current_actual_area": 78.58528929032387,
        "current_max_area": "452.4014476910546700",
        "area": "100",
        "month": "aug_2026"
    },
    {
        "total_water_bodies": "7",
        "total_max_area": 699.6831318002007,
        "current_water_bodies": "7",
        "current_actual_area": 116.54267363548279,
        "current_max_area": "699.6831318002007000",
        "area": "5000",
        "month": "aug_2026"
    }
]

DATA_PROVENANCE_WBIS = "ISRO/NRSC Bhuvan Water Bodies Information System (WBIS), Cauvery Basin"
DATA_PROVENANCE_TN_LULC = "ISRO/NRSC Bhuvan Thematic Services, Tamil Nadu LULC 1:50,000 (2015-16)"


def process_wbis_records(records: List[Dict[str, Any]], source: str, basin: str, month: str) -> Dict[str, Any]:
    """Helper to compute capacity utilization % and aggregated totals."""
    processed_records = []
    total_wb = 0
    current_wb = 0
    total_max_area = 0.0
    current_actual_area = 0.0

    area_labels = {
        "10": "< 10 Hectares (Small Water Bodies & Tanks)",
        "100": "10 - 100 Hectares (Medium Reservoirs & Lakes)",
        "5000": "> 100 Hectares (Major Dams & Impoundments)"
    }

    for item in records:
        t_wb = int(item.get("total_water_bodies", 0))
        c_wb = int(item.get("current_water_bodies", 0))
        t_max_area = float(item.get("total_max_area", 0.0))
        c_act_area = float(item.get("current_actual_area", 0.0))
        c_max_area = float(item.get("current_max_area", 0.0))
        area_code = str(item.get("area", ""))

        total_wb += t_wb
        current_wb += c_wb
        total_max_area += t_max_area
        current_actual_area += c_act_area

        cap_util = round((c_act_area / t_max_area * 100.0), 2) if t_max_area > 0 else 0.0

        processed_records.append({
            "area_code": area_code,
            "category_label": area_labels.get(area_code, f"Category {area_code} Ha"),
            "total_water_bodies": t_wb,
            "current_water_bodies": c_wb,
            "total_max_area_sqkm": round(t_max_area, 2),
            "current_actual_area_sqkm": round(c_act_area, 2),
            "current_max_area_sqkm": round(c_max_area, 2),
            "capacity_utilization_pct": cap_util,
            "month": item.get("month", month)
        })

    overall_util = round((current_actual_area / total_max_area * 100.0), 2) if total_max_area > 0 else 0.0

    return {
        "basin": basin,
        "month": month,
        "source": source,
        "data_provenance": DATA_PROVENANCE_WBIS,
        "total_water_bodies": total_wb,
        "current_water_bodies": current_wb,
        "water_bodies_active_pct": round((current_wb / total_wb * 100.0), 1) if total_wb > 0 else 0.0,
        "total_max_area_sqkm": round(total_max_area, 2),
        "current_actual_area_sqkm": round(current_actual_area, 2),
        "overall_capacity_utilization_pct": overall_util,
        "categories": processed_records,
        "raw_response": records
    }


def get_water_spread_stats(basin: str = "Cauvery Basin", month: str = "aug_2026") -> Dict[str, Any]:
    """
    Fetches WBIS Water Spread statistics for a specified river basin and month.
    Calls live Bhuvan endpoint with 10-second timeout.
    Falls back to real captured fallback data if the live call fails or times out.
    """
    basin_urlencoded = urllib.parse.quote(basin)
    url = f"{WBIS_BASE_URL}/{basin_urlencoded}/{month}"

    try:
        resp = requests.get(url, timeout=10.0, verify=False)
        if resp.status_code == 200:
            data = resp.json()
            if isinstance(data, list) and len(data) > 0:
                return process_wbis_records(data, source="live", basin=basin, month=month)
    except Exception as e:
        print(f"[WBIS API Notice] Live fetch failed ({e}). Using verified cached fallback.")

    return process_wbis_records(WBIS_FALLBACK_DATA, source="cached_fallback", basin=basin, month=month)


def get_state_lulc_chart(state_code: str = "TN", year: str = "1516") -> Dict[str, Any]:
    """
    Fetches real Tamil Nadu LULC Thematic reference data from Bhuvan:
    1. Chart PNG from chart.php
    2. Detailed class statistics table from theme_stats/lulc_lulc503.php
    Parses HTML into structured class list with color codes, area (sq km), and % share.
    """
    chart_url = f"{THEMATIC_CHART_URL}?year={year}&name={state_code}"
    stats_url = f"{THEMATIC_STATS_URL}?name={state_code}"

    chart_base64 = None
    chart_error = None
    stats_error = None
    title = f"LULC Information ({year}) for Tamil Nadu"
    total_area_sqkm = 130058.0
    classes = []

    # 1. Fetch Chart Image
    try:
        r_chart = requests.get(chart_url, timeout=10.0, verify=False)
        if r_chart.status_code == 200 and len(r_chart.content) > 0:
            chart_base64 = base64.b64encode(r_chart.content).decode("utf-8")
        else:
            chart_error = f"HTTP {r_chart.status_code}"
    except Exception as e:
        chart_error = str(e)

    # 2. Fetch & Parse Stats HTML
    try:
        r_stats = requests.get(stats_url, timeout=10.0, verify=False)
        if r_stats.status_code == 200 and r_stats.text:
            html = r_stats.text
            
            # Extract title
            title_m = re.search(r"LULC Information[^\n<]+", html, re.IGNORECASE)
            if title_m:
                title = title_m.group(0).strip()

            # Extract total area
            area_m = re.search(r"Total Geographical Area\s*:\s*(?:&nbsp;)?\s*([\d\.]+)\s*Sq", html, re.IGNORECASE)
            if area_m:
                total_area_sqkm = float(area_m.group(1))

            # Regex pattern for table rows: color td, class name td, area td
            pattern = re.compile(
                r"bgcolor=([#\w]+)[^>]*>\s*</td>\s*<td[^>]*>([^<]+)</td>\s*<td[^>]*>([\d\.\s&nbsp;]+)</td>",
                re.IGNORECASE
            )
            matches = pattern.findall(html)
            
            for color_val, name_val, area_val_str in matches:
                color = color_val.strip()
                if not color.startswith("#"):
                    color = f"#{color}"
                class_name = name_val.strip()
                area_clean = area_val_str.replace("&nbsp;", "").replace("\xa0", "").strip()
                try:
                    area_num = float(area_clean)
                except (ValueError, TypeError):
                    area_num = 0.0

                if class_name:
                    pct = round((area_num / total_area_sqkm * 100.0), 2) if total_area_sqkm > 0 else 0.0
                    classes.append({
                        "class_name": class_name,
                        "color": color,
                        "area_sqkm": area_num,
                        "percent_of_total": pct
                    })
        else:
            stats_error = f"HTTP {r_stats.status_code}"
    except Exception as e:
        stats_error = str(e)

    sorted_classes = sorted(classes, key=lambda c: c["area_sqkm"], reverse=True)

    return {
        "state_code": state_code,
        "year": year,
        "title": title,
        "total_area_sqkm": total_area_sqkm,
        "classes": classes,
        "top_classes": sorted_classes[:5],
        "total_classes_count": len(classes),
        "chart_image_base64": chart_base64,
        "chart_url": chart_url,
        "stats_url": stats_url,
        "chart_error": chart_error,
        "stats_error": stats_error,
        "data_provenance": DATA_PROVENANCE_TN_LULC,
        "source": "live" if (chart_base64 and len(classes) > 0) else "partial_live"
    }


