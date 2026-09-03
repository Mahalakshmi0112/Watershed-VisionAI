# WatershedVision-AI — Project Progress & Architecture Report

**Date:** September 3, 2026  
**Project:** WatershedVision-AI (Rural Watershed Structure Monitoring, Prioritization & Prediction)  
**Location:** `C:\Users\Maha\.gemini\antigravity-ide\scratch\WatershedVision_AI`

---

## 1. Executive Summary

WatershedVision-AI has been built end-to-end as a full-stack AI system designed for rural watershed structures (check dams, farm ponds, earthen bunds, contour trenches). It fuses ground-level field photos with multi-temporal satellite vegetation indices and spatial GIS boundaries to monitor physical degradation, predict 3–12 month structural failures, and rank inspection priorities for field officers.

Both backend and frontend services are operational locally:
- **Backend Service:** FastAPI REST API running on `http://localhost:8000` (Swagger docs: `/docs`)
- **Frontend Dashboard:** React 18 + Vite + Tailwind CSS running on `http://localhost:3000`

---

## 2. "What's Used Instead of What" (Architectural Decisions & Substitutions)

This table summarizes key technology choices, constraints enforced, and fallback mechanisms implemented:

| Component / Layer | What Was Used | What Was Avoided / Replaced | Reason & Rationale |
| :--- | :--- | :--- | :--- |
| **Computer Vision (CV)** | **Custom Dual-Head PyTorch ResNet18** with **Grad-CAM** | 3rd-party vision LLMs (GPT-4V, Gemini Pro Vision, Claude Vision) | **Hard requirement**: Core structural damage assessment and type classification must use custom-trained models with verifiable layer activation heatmaps, not black-box LLM API wrappers. |
| **Degradation Forecaster** | **Custom XGBoost Tabular Classifier** | Guesswork heuristics / generic neural nets | XGBoost delivers high precision on tabular slope/velocity features and outputs explainable degradation driver probabilities for 3–12 month risk. |
| **Satellite Imagery** | **Google Earth Engine (GEE) Python API** with **Automatic Synthetic Fallback** | Silent mock data or hard failure when credentials are missing | GEE pulls Sentinel-2 (10m) & Landsat NDVI/NDWI. If GEE credentials are absent, an explicit fallback generator activates, emits a `WARNING` log, and tags records as `data_source: 'synthetic'`. |
| **Synthetic Observation Handling** | **Observation-Level Filtering** | Whole-structure discarding | The XGBoost pipeline filters out individual observations where `data_source == 'synthetic'`, retaining all valid real data. Structures are only excluded if $< 3$ real data points remain. |
| **Database Engine** | **PostgreSQL 15 + PostGIS 3.3** (with transparent SQLite Fallback) | SpatiaLite / dual DB complexity | Standardized on PostGIS via SQLAlchemy + GeoAlchemy2. When Docker/Postgres is offline during local development, engine auto-falls back to local SQLite (`watershedvision.db`) using custom geometry compilation rules. |
| **Interactive Map Tiles** | **OpenStreetMap (OSM) Tiles** (`tile.openstreetmap.org`) + CSS Invert/Hue Filter | CartoDB Tiles (`cartocdn.com`) | Carto deprecated its open public tile tier and now renders an intrusive `"API KEY REQUIRED"` watermark. OSM is 100% free and open, with CSS dark mode styling applied seamlessly. |
| **Navigation Layout** | **Collapsible Left Sidebar** (`Sidebar.tsx`) | Crammed Top Navigation Bar | Left sidebar provides clean vertical hierarchy, space for collapse toggles, user persona indicators, and persistent demo notices without horizontal wrapping issues. |
| **Authentication & RBAC** | **JWT Bearer Auth with Auto-Token Persistence** (`localStorage`) | Static mock headers (`demo-token`) | Admin actions (satellite pull, GeoJSON import) are protected via `require_role("admin")`. Real JWT tokens are issued via `/api/v1/auth/login` and automatically cached in `localStorage`. |
| **Field Photo Verification** | **Perceptual Hash (`imagehash`) + EXIF GPS Join** | Plain file upload without validation | Detects duplicate/fraudulent uploads using perceptual hamming distance ($\le 5$) and matches photos to known structures within 100m using spatial distance. |

---

## 3. What Is Included in the Codebase

### A. Data Ingestion Engine (`backend/ingestion/`)
- **`field_image_ingest.py`**:
  - EXIF reader for latitude, longitude, altitude, heading, and timestamp.
  - Perceptual image hashing (`imagehash.phash`) duplicate detection.
  - Spatial point-in-radius matching against existing structures (100m tolerance).
- **`satellite_gee_ingest.py`**:
  - GEE Python API Sentinel-2 & Landsat indices puller.
  - Synthetic fallback generator tagging `data_source: 'synthetic'` with clear `WARNING` logging.
  - Rolling NDVI and NDWI time-series generator.
- **`gis_layer_ingest.py`**:
  - GeoJSON FeatureCollection parser and database importer with automatic schema versioning.
- **`stubs/`**: Extensibility stubs for Rainfall (IMD/ERA5), Soil (SoilGrids), and Field Inspection feedback.

### B. Machine Learning & Fusion Pipeline (`backend/ml/`)
- **`cv_model/`**:
  - `model.py`: PyTorch `DualHeadResNet18` predicting Structure Type (5 classes) and Condition (4 classes: Intact, Minor Damage, Moderate Damage, Major Damage).
  - `gradcam_engine.py`: Explainability engine producing Jet colormap overlays for structural breaches.
  - `train_cv.py` & `bootstrap_dataset.py`: Bootstrapped dataset training pipeline saving `cv_resnet18_v1.pt`.
- **`forecast_model/`**:
  - `feature_engineering.py`: Computes NDVI slope, NDWI volatility, condition velocity, age. Filters synthetic records at observation level.
  - `train_forecast.py` & `bootstrap_labels.py`: XGBoost training script saving `forecast_xgb_v1.json`.
- **`fusion/fusion_engine.py`**:
  - Dynamic weighted scoring: $0.45 \times \text{CV} + 0.25 \times \text{Satellite} + 0.30 \times \text{Forecast}$.
  - Dynamic tier resolution: `Healthy` ($0–30$), `Monitor` ($31–65$), `Urgent` ($66–100$) configurable in `backend/config/scoring_config.json`.
- **`report/report_generator.py`**:
  - Automated natural language summary generator for field inspectors.

### C. Backend API Service (`backend/api/`)
- `auth.py`: JWT login endpoint (`POST /api/v1/auth/login`) with `sha256_crypt` password hashing.
- `deps.py`: OAuth2 password bearer token validation and `require_role("admin")` dependency.
- `structures.py`: Structure list and detail endpoints with `is_synthetic` indicator directly on list responses.
- `photos.py`: Multipart photo upload with EXIF extraction, pHash check, spatial join, and Grad-CAM generation.
- `ingestion.py`: Admin-only satellite pull trigger (`POST /api/v1/ingestion/satellite-pull`).
- `gis.py`: Admin-only GeoJSON boundary importer (`POST /api/v1/gis/import`).
- `inspections.py`: Field inspection logging (`POST /api/v1/inspections`).
- `reports.py`: Summary report generator and CSV export.

### D. React Frontend Application (`frontend/src/`)
- **`Sidebar.tsx`**: Collapsible left navigation bar with active route highlight, role indicator (`Admin` vs `Field Officer`), role switcher, demo indicator, and dark mode toggle.
- **7 Dashboard Pages**:
  1. `OverviewPage.tsx`: Executive summary, total/healthy/monitor/urgent KPI cards, priority split pie chart, urgent alert target list, demo badge.
  2. `MapViewPage.tsx`: Leaflet GIS map with color-coded markers, time-slider for temporal NDVI changes, OSM basemap with dark theme CSS filter, structure popup cards.
  3. `StructureDetailPage.tsx`: Structure header, interactive Grad-CAM heatmap toggle, multi-criteria score breakdown bars, rolling NDVI/NDWI Recharts line graph, officer summary.
  4. `PriorityQueuePage.tsx`: Actionable officer queue sorted by priority score with search, tier filter, and inspection logging modal.
  5. `PredictionsAlertsPage.tsx`: 3–12 month forward failure forecasts with risk drivers and degradation probability meters.
  6. `IngestionAdminPage.tsx`: Drag-and-drop field photo upload, manual satellite pull trigger, GeoJSON importer.
  7. `ReportsPage.tsx`: Regional performance analytics, summary statistics, and CSV data export.

---

## 4. Test & Verification Summary

1. **Smoke Test (`python smoke_test.py`)**:
   - Step 1: Database Initialization & Seeding &rarr; **PASS** (5 structures, 2 users)
   - Step 2: Role-Based Access Control (RBAC) &rarr; **PASS** (Admin 200 OK, Officer 403 Forbidden)
   - Step 3: Field Photo EXIF, pHash & Grad-CAM Heatmap &rarr; **PASS**
   - Step 4: Satellite Data Puller & Synthetic Fallback Warning &rarr; **PASS**
   - Step 5: Observation-Level Synthetic Data Exclusion &rarr; **PASS**
   - Step 6: Structure List API `is_synthetic` Flag &rarr; **PASS**
   - Step 7: Configurable Priority Scoring &rarr; **PASS**

2. **Pytest Unit Test Suite (`python -m pytest tests/`)**:
   - **16/16 tests passing** across `test_api.py`, `test_cv_model.py`, `test_forecast_model.py`, `test_fusion_scoring.py`, `test_ingestion.py`, `test_rbac.py`.

---

## 5. Quick Access Reference

- **Frontend URL:** http://localhost:3000
- **Backend URL:** http://localhost:8000
- **API Documentation:** http://localhost:8000/docs
- **Default Credentials:**
  - Administrator: `admin` / `admin123`
  - Field Officer: `officer` / `officer123`
