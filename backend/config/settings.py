import json
import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).resolve().parent.parent.parent / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    PROJECT_NAME: str = "WatershedVision-AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # DB configuration
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "postgres")
    POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER", "localhost")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5432")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "watershedvision")
    
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_SERVER}:{POSTGRES_PORT}/{POSTGRES_DB}"
    )
    
    # Auth & Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "watershed_secret_key_change_in_prod_123456789")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    
    # GEE Credentials
    EE_SERVICE_ACCOUNT: str = os.getenv("EE_SERVICE_ACCOUNT", "")
    EE_PRIVATE_KEY_FILE: str = os.getenv("EE_PRIVATE_KEY_FILE", "")
    
    # Bhuvan API Credentials
    BHUVAN_LULC_TOKEN: str = os.getenv("BHUVAN_LULC_TOKEN", "")
    
    # Storage Paths
    UPLOAD_DIR: str = str(BASE_DIR / "static" / "uploads")
    GRADCAM_DIR: str = str(BASE_DIR / "static" / "gradcam")
    REFERENCE_STATIC_DIR: str = str(BASE_DIR / "static" / "reference")
    MODELS_DIR: str = str(BASE_DIR / "models")
    
    # Scoring Config Path
    SCORING_CONFIG_PATH: str = str(BASE_DIR / "config" / "scoring_config.json")
    
    def get_scoring_config(self) -> dict:
        config_path = Path(self.SCORING_CONFIG_PATH)
        if config_path.exists():
            with open(config_path, "r") as f:
                return json.load(f)
        return {
            "weights": {"w_condition": 0.45, "w_satellite": 0.25, "w_forecast": 0.30},
            "tier_boundaries": {"healthy_max": 30.0, "monitor_max": 65.0, "urgent_min": 65.01},
            "forecast": {"min_real_observations": 3}
        }

settings = Settings()

# Ensure static directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.GRADCAM_DIR, exist_ok=True)
os.makedirs(settings.REFERENCE_STATIC_DIR, exist_ok=True)
os.makedirs(settings.MODELS_DIR, exist_ok=True)
