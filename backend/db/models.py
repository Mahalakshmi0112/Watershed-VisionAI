import sys
import os
sys.path.insert(0, r"C:\Users\Maha\AppData\Roaming\Python\Python314\site-packages")

import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
)
from sqlalchemy.orm import declarative_base, relationship
from backend.db.session import IS_SQLITE

if IS_SQLITE:
    # In SQLite fallback mode, use Text column to avoid SpatiaLite DDL listener requirements
    def Geometry(spec=None, srid=4326, **kwargs):
        return Text()
else:
    from geoalchemy2 import Geometry

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="officer")  # 'officer' or 'admin'
    full_name = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    inspections = relationship("InspectionLog", back_populates="officer")


class Structure(Base):
    __tablename__ = "structures"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    structure_type = Column(String(50), nullable=False)  # check_dam, farm_pond, bund, contour_trench, other
    watershed_name = Column(String(100), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    geom = Column(Geometry('POINT', srid=4326), nullable=True)
    construction_year = Column(Integer, nullable=True)
    is_synthetic = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    photos = relationship("FieldPhoto", back_populates="structure", cascade="all, delete-orphan")
    satellite_observations = relationship("SatelliteObservation", back_populates="structure", cascade="all, delete-orphan")
    inspections = relationship("InspectionLog", back_populates="structure", cascade="all, delete-orphan")
    scores = relationship("StructureScore", back_populates="structure", cascade="all, delete-orphan")


class FieldPhoto(Base):
    __tablename__ = "field_photos"

    id = Column(Integer, primary_key=True, index=True)
    structure_id = Column(Integer, ForeignKey("structures.id"), nullable=True)
    photo_url = Column(String(255), nullable=False)
    gradcam_url = Column(String(255), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    altitude = Column(Float, nullable=True)
    heading = Column(Float, nullable=True)
    captured_at = Column(DateTime, default=datetime.datetime.utcnow)
    perceptual_hash = Column(String(64), nullable=True, index=True)
    predicted_type = Column(String(50), nullable=True)
    predicted_condition = Column(String(50), nullable=True)
    condition_score = Column(Float, nullable=True)
    source = Column(String(50), nullable=False, default="real_officer_upload")  # 'real_officer_upload', 'drishti_import'
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    structure = relationship("Structure", back_populates="photos")


class SatelliteObservation(Base):
    __tablename__ = "satellite_observations"

    id = Column(Integer, primary_key=True, index=True)
    structure_id = Column(Integer, ForeignKey("structures.id"), nullable=False)
    observation_date = Column(DateTime, nullable=False, index=True)
    ndvi = Column(Float, nullable=False)
    ndwi = Column(Float, nullable=False)
    data_source = Column(String(20), nullable=False, default="real")  # 'real' or 'synthetic'
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    structure = relationship("Structure", back_populates="satellite_observations")


class GISBoundary(Base):
    __tablename__ = "gis_boundaries"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    boundary_type = Column(String(50), nullable=False)  # watershed, micro_watershed, drainage
    geom = Column(Geometry('POLYGON', srid=4326), nullable=True)
    properties_json = Column(JSON, nullable=True)
    version = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class InspectionLog(Base):
    __tablename__ = "inspection_logs"

    id = Column(Integer, primary_key=True, index=True)
    structure_id = Column(Integer, ForeignKey("structures.id"), nullable=False)
    officer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    inspection_date = Column(DateTime, default=datetime.datetime.utcnow)
    observed_condition = Column(String(50), nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    structure = relationship("Structure", back_populates="inspections")
    officer = relationship("User", back_populates="inspections")


class StructureScore(Base):
    __tablename__ = "structure_scores"

    id = Column(Integer, primary_key=True, index=True)
    structure_id = Column(Integer, ForeignKey("structures.id"), nullable=False)
    condition_score = Column(Float, nullable=False)
    satellite_trend_risk = Column(Float, nullable=False)
    forecast_risk = Column(Float, nullable=False)
    composite_score = Column(Float, nullable=False)
    priority_tier = Column(String(20), nullable=False)  # Healthy, Monitor, Urgent
    evaluated_at = Column(DateTime, default=datetime.datetime.utcnow)

    structure = relationship("Structure", back_populates="scores")
