import site
import sys
site.addsitedir(r"C:\Users\Maha\AppData\Roaming\Python\Python314\site-packages")

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.config.settings import settings
from backend.db.seed import seed_database
from backend.api import auth, structures, photos, ingestion, gis, inspections, reports, thematic

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="End-to-end monitoring, prioritization, and prediction system for small-scale rural watershed structures."
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded field photos and Grad-CAM overlays
app.mount("/static/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")
app.mount("/static/gradcam", StaticFiles(directory=settings.GRADCAM_DIR), name="gradcam")

# Mount API Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(structures.router, prefix=settings.API_V1_STR)
app.include_router(photos.router, prefix=settings.API_V1_STR)
app.include_router(ingestion.router, prefix=settings.API_V1_STR)
app.include_router(gis.router, prefix=settings.API_V1_STR)
app.include_router(inspections.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)
app.include_router(thematic.router, prefix=settings.API_V1_STR)
app.include_router(thematic.router)

@app.on_event("startup")
def on_startup():
    print(f"[{settings.PROJECT_NAME}] Initializing database schema & seed data...")
    seed_database()

@app.get("/")
def root():
    return {
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
