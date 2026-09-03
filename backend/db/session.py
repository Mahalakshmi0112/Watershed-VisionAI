import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from backend.config.settings import settings

DATABASE_URL = settings.DATABASE_URL

# Fallback mechanism if local Postgres daemon is unreachable or password fails during non-docker local python runs
try:
    if DATABASE_URL.startswith("postgresql"):
        temp_engine = create_engine(DATABASE_URL, connect_args={"connect_timeout": 2})
        with temp_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        engine = temp_engine
        IS_SQLITE = False
        print("[DB Session] Connected to PostgreSQL + PostGIS database.")
    else:
        IS_SQLITE = True
        engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
except Exception as e:
    print(f"[DB Session Notice] PostgreSQL connection failed ({e}). Falling back to local SQLite for offline development/testing.")
    DATABASE_URL = "sqlite:///./watershedvision.db"
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
    IS_SQLITE = True

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
