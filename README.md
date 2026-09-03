# WatershedVision-AI 🌊🛰️

**WatershedVision-AI** is an end-to-end monitoring, prioritization, and prediction system for small-scale rural watershed structures (check dams, farm ponds, bunds, contour trenches). It ingests geo-tagged field photos, satellite imagery (Sentinel-2/Landsat via Google Earth Engine), and GIS layers to deliver real-time structure condition analysis, multi-criteria priority scoring, and failure risk forecasting.

---

## 1. System Architecture

```
┌─────────────────┐   ┌──────────────────┐   ┌───────────────────┐
│ Field Photo API │   │ GEE Sat Puller   │   │ GIS Admin Import  │
│ (EXIF + Hash)   │   │ (APScheduler)    │   │ (GeoJSON/Layers)  │
└────────┬────────┘   └────────┬─────────┘   └─────────┬─────────┘
         │                     │                       │
         ▼                     ▼                       ▼
┌────────────────────────────────────────────────────────────────┐
│                   PostGIS Feature Store Database               │
└────────┬──────────────────────┬──────────────────────┬─────────┘
         ▼                      ▼                      ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ CV Model (PyTorch│    │ Forecast Model   │    │ Fusion Scoring  │
│ ResNet18+GradCAM│    │ (XGBoost Trend)  │    │ Engine          │
└────────┬────────┘    └────────┬─────────┘    └────────┬────────┘
         └───────────────┬──────┴───────────────────────┘
                         ▼
                 ┌───────────────┐
                 │ FastAPI Async │
                 │ REST + RBAC   │
                 └───────┬───────┘
                         ▼
                 ┌───────────────┐
                 │ React + TS    │
                 │ Dashboard UI  │
                 └───────┬───────┘
```

---

## 2. Setup Instructions

### Local Docker Setup (Recommended)
Spin up PostgreSQL + PostGIS, FastAPI backend, and React dashboard:

```bash
# 1. Clone & navigate to project directory
cd WatershedVision_AI

# 2. Build and launch containerized stack
docker-compose up --build
```

Access services:
- **React Dashboard UI**: `http://localhost:3000` (or Vite dev port `http://localhost:3000`)
- **FastAPI REST Server**: `http://localhost:8000`
- **Swagger Interactive API Docs**: `http://localhost:8000/docs`

### Local Python Environment Setup
```bash
# 1. Create and activate virtual environment
python -m venv venv
venv\Scripts\activate  # On Windows

# 2. Install backend dependencies
pip install -r backend/requirements.txt

# 3. Initialize database and seed sample structures
python -m backend.db.seed

# 4. Launch FastAPI server
uvicorn backend.main:app --reload --port 8000
```

### Environment Variables
Configure `.env` or environment variables:
```ini
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_SERVER=localhost
POSTGRES_PORT=5432
POSTGRES_DB=watershedvision
SECRET_KEY=watershed_secret_key_change_in_prod
EE_SERVICE_ACCOUNT=your-gee-service-account@app.iam.gserviceaccount.com
EE_PRIVATE_KEY_FILE=path/to/gee-private-key.json
```

---

## 3. Data Ingestion Methods

### Source 1 — Field Image Upload (API + cURL Sample)
Uploads field photo, extracts EXIF metadata (lat/lon, timestamp), performs perceptual hash (`imagehash`) duplicate check, spatially matches photo to nearest structure within 100m, runs PyTorch CV model inference, and generates Grad-CAM heatmap overlay.

```bash
curl -X POST "http://localhost:8000/api/v1/photos/upload" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@sample_dam.jpg;type=image/jpeg" \
  -F "latitude=19.1864" \
  -F "longitude=73.1919"
```

### Source 2 — Satellite Imagery Pull (GEE & Scheduled Job)
Pull Sentinel-2 / Landsat NDVI & NDWI indices for registered structures.

- **Scheduled Job**: Runs automatically every week via APScheduler inside the backend.
- **Manual Trigger (Admin Only Route / CLI)**:
  ```bash
  # CLI Trigger
  python -m backend.ingestion.satellite_gee_ingest

  # API Trigger (Admin Role Required)
  curl -X POST "http://localhost:8000/api/v1/ingestion/satellite-pull" \
    -H "Authorization: Bearer <ADMIN_JWT_TOKEN>"
  ```

*Note on Synthetic Fallback Safeguard*: If GEE credentials are missing, the system logs a clear `WARNING` and generates realistic synthetic observations tagged `data_source: 'synthetic'`. The UI displays a `Demo data — GEE not connected` badge on map markers and summary cards.

### Source 3 — GIS Boundary Import (Admin Only)
Import versioned GeoJSON spatial boundaries (watersheds, drainage networks, master structures):

```bash
curl -X POST "http://localhost:8000/api/v1/gis/import?boundary_type=watershed" \
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"type":"FeatureCollection","features":[{"type":"Feature","properties":{"name":"Pej Sub-Watershed"},"geometry":{"type":"Polygon","coordinates":[[[73.3,18.9],[73.4,18.9],[73.4,19.0],[73.3,19.0],[73.3,18.9]]]}}]}'
```

### Source 4 — Future Extensible Stubs
Pluggable stubs are located in `backend/ingestion/stubs/`:
- `rainfall_stub.py`: Interface for IMD / ERA5 gridded rainfall data.
- `soil_stub.py`: Interface for SoilGrids texture & organic carbon data.
- `inspection_feedback_stub.py`: Interface for field officer ground-truth inspection outcomes.

---

## 4. ML Model Training Instructions

### Model 1 — PyTorch CV Classification & Condition Model
Train Dual-Head ResNet18 transfer learning backbone (Structure Type + Condition):

```bash
python -m backend.ml.cv_model.train_cv
```
- **Dataset**: Bootstrapped dual-labeled structure images (`backend/ml/cv_model/bootstrap_dataset.py`).
- **Data Augmentations**: RandomRotation(15°), ColorJitter, RandomHorizontalFlip.
- **Output Artifact**: Saved checkpoint to `backend/models/cv_resnet18_v1.pt`.

### Model 2 — XGBoost Time-Series Degradation Forecast Model
Train tabular forecasting model predicting failure risk over 3–12 months:

```bash
python -m backend.ml.forecast_model.train_forecast
```
- **Feature Engineering**: NDVI/NDWI slope, rate of change, volatility, condition history, structure age.
- **Observation-Level Synthetic Exclusion**: Filters out individual observations tagged `data_source == 'synthetic'`, keeping all valid real observations. Excludes structure only if fewer than 3 real observations exist.
- **Output Artifact**: Saved model file to `backend/models/forecast_xgb_v1.json`.

---

## 5. Model Testing & Evaluation Instructions

Run complete unit and integration test suite:

```bash
python -m pytest tests/
```

Individual test modules:
- `python -m pytest tests/test_ingestion.py` (EXIF, pHash, spatial join, GEE synthetic fallback)
- `python -m pytest tests/test_cv_model.py` (ResNet18 forward pass & Grad-CAM engine)
- `python -m pytest tests/test_forecast_model.py` (Observation-level synthetic filtering & XGBoost)
- `python -m pytest tests/test_fusion_scoring.py` (Configurable weights & priority tier boundaries)
- `python -m pytest tests/test_rbac.py` (Admin vs Officer endpoint authorization)
- `python -m pytest tests/test_api.py` (FastAPI REST endpoints & `is_synthetic` list response)

---

## 6. End-to-End Smoke Test Instructions

Execute automated single-command smoke test:

```bash
python smoke_test.py
```

The script verifies:
1. DB schema initialization & structure seeding
2. Role-Based Access Control (RBAC) route authorization
3. Field photo EXIF extraction, pHash fraud check, & Grad-CAM overlay generation
4. GEE satellite pull & synthetic fallback warning logging
5. Observation-level synthetic data exclusion in forecast feature extraction
6. Structure list API endpoint returning `is_synthetic: boolean`
7. Multi-criteria priority score calculation with `scoring_config.json`

Prints `[ PASS ]` for each step and exits with code 0 on full success.

---

## 7. Known Limitations

1. **Weak-Supervision Initial Labels**: Ground-truth failure datasets for check dams do not publicly exist. The forecast model starts from domain-expert heuristic rules (`bootstrap_labels.py`) and continuously transitions to true field labels as officers log inspection outcomes (`/api/v1/inspections`).
2. **Synthetic Satellite Fallback**: When GEE API credentials are absent, synthetic data is generated and tagged `data_source: 'synthetic'`, accompanied by a prominent warning badge in the UI.

---

## 8. Future Scope & Production Upgrade Paths

- **Scheduler Scaling**: Upgrade APScheduler to Apache Airflow or Prefect for distributed satellite ETL workflows.
- **Model Server**: Serve PyTorch CV models via TorchServe / BentoML for multi-GPU scaling.
- **Gridded Climate Data**: Wire IMD / ERA5 daily rainfall data into `rainfall_stub.py`.
- **Soil Layer Integration**: Connect SoilGrids API into `soil_stub.py`.
