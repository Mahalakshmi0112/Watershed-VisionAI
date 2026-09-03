import site
import sys
site.addsitedir(r"C:\Users\Maha\AppData\Roaming\Python\Python314\site-packages")

import datetime
from passlib.context import CryptContext
from backend.db.session import engine, SessionLocal
from backend.db.models import (
    Base, User, Structure, SatelliteObservation, FieldPhoto, StructureScore, InspectionLog
)

pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")

def seed_database():
    Base.metadata.create_all(bind=engine)
    
    # Safe column migration for existing databases
    from sqlalchemy import text
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE field_photos ADD COLUMN source VARCHAR(50) DEFAULT 'real_officer_upload'"))
            conn.commit()
    except Exception:
        pass

    db = SessionLocal()

    try:
        # 1. Seed Users if empty
        if db.query(User).count() == 0:
            admin_user = User(
                username="admin",
                hashed_password=pwd_context.hash("admin123"),
                role="admin",
                full_name="System Administrator"
            )
            officer_user = User(
                username="officer",
                hashed_password=pwd_context.hash("officer123"),
                role="officer",
                full_name="Field Officer Ramesh"
            )
            db.add_all([admin_user, officer_user])
            db.commit()
            print("[SEED] Default admin and officer users created.")

        # 2. Seed Structures if empty
        if db.query(Structure).count() == 0:
            structures_data = [
                {
                    "code": "STR-MH-001",
                    "name": "Ambernath Check Dam #1",
                    "structure_type": "check_dam",
                    "watershed_name": "Ulhas River Basin",
                    "latitude": 19.1864,
                    "longitude": 73.1919,
                    "construction_year": 2019,
                    "is_synthetic": False
                },
                {
                    "code": "STR-MH-002",
                    "name": "Badlapur Farm Pond A",
                    "structure_type": "farm_pond",
                    "watershed_name": "Ulhas River Basin",
                    "latitude": 19.1663,
                    "longitude": 73.2368,
                    "construction_year": 2021,
                    "is_synthetic": False
                },
                {
                    "code": "STR-KA-003",
                    "name": "Dharwad Contour Trench Sector 4",
                    "structure_type": "contour_trench",
                    "watershed_name": "Malaprabha Basin",
                    "latitude": 15.4589,
                    "longitude": 75.0078,
                    "construction_year": 2018,
                    "is_synthetic": True
                },
                {
                    "code": "STR-MH-004",
                    "name": "Karjat Earthen Bund West",
                    "structure_type": "bund",
                    "watershed_name": "Pej Sub-Basin",
                    "latitude": 18.9102,
                    "longitude": 73.3283,
                    "construction_year": 2017,
                    "is_synthetic": False
                },
                {
                    "code": "STR-MH-005",
                    "name": "Panvel Nalla Plug #3",
                    "structure_type": "check_dam",
                    "watershed_name": "Gadhi River Sub-Basin",
                    "latitude": 18.9894,
                    "longitude": 73.1175,
                    "construction_year": 2022,
                    "is_synthetic": False
                }
            ]

            created_structures = []
            for item in structures_data:
                s = Structure(
                    code=item["code"],
                    name=item["name"],
                    structure_type=item["structure_type"],
                    watershed_name=item["watershed_name"],
                    latitude=item["latitude"],
                    longitude=item["longitude"],
                    construction_year=item["construction_year"],
                    is_synthetic=item["is_synthetic"]
                )
                db.add(s)
                created_structures.append(s)
            
            db.commit()
            print(f"[SEED] Seeded {len(created_structures)} watershed structures.")

            for s in created_structures:
                db.refresh(s)

            # 3. Seed Satellite Time-Series
            now = datetime.datetime.utcnow()
            for s in created_structures:
                for i in range(6):
                    obs_date = now - datetime.timedelta(days=(5 - i) * 30)
                    if s.code == "STR-MH-004":
                        ndvi_val = max(0.15, 0.55 - (i * 0.08))
                        ndwi_val = max(-0.1, 0.30 - (i * 0.07))
                    else:
                        ndvi_val = 0.45 + (i * 0.02)
                        ndwi_val = 0.20 + (i * 0.01)

                    source_flag = "synthetic" if s.is_synthetic else "real"
                    sat_obs = SatelliteObservation(
                        structure_id=s.id,
                        observation_date=obs_date,
                        ndvi=round(ndvi_val, 3),
                        ndwi=round(ndwi_val, 3),
                        data_source=source_flag
                    )
                    db.add(sat_obs)

            # 4. Seed Field Photos & Scores
            officer = db.query(User).filter(User.role == "officer").first()
            for s in created_structures:
                if s.code == "STR-MH-004":
                    cond = "major_damage"
                    c_score = 75.0
                    sat_risk = 80.0
                    fc_risk = 85.0
                    tier = "Urgent"
                elif s.code == "STR-KA-003":
                    cond = "minor_damage"
                    c_score = 45.0
                    sat_risk = 40.0
                    fc_risk = 50.0
                    tier = "Monitor"
                else:
                    cond = "intact"
                    c_score = 10.0
                    sat_risk = 15.0
                    fc_risk = 12.0
                    tier = "Healthy"

                photo = FieldPhoto(
                    structure_id=s.id,
                    photo_url=f"/static/uploads/sample_{s.code.lower()}.jpg",
                    gradcam_url=f"/static/gradcam/gradcam_{s.code.lower()}.jpg",
                    latitude=s.latitude,
                    longitude=s.longitude,
                    captured_at=now - datetime.timedelta(days=10),
                    perceptual_hash=f"hash_{s.code.lower()}",
                    predicted_type=s.structure_type,
                    predicted_condition=cond,
                    condition_score=c_score,
                    source="real_officer_upload"
                )
                db.add(photo)

                comp_score = round(c_score * 0.45 + sat_risk * 0.25 + fc_risk * 0.30, 2)
                score = StructureScore(
                    structure_id=s.id,
                    condition_score=c_score,
                    satellite_trend_risk=sat_risk,
                    forecast_risk=fc_risk,
                    composite_score=comp_score,
                    priority_tier=tier
                )
                db.add(score)

                if officer:
                    insp = InspectionLog(
                        structure_id=s.id,
                        officer_id=officer.id,
                        inspection_date=now - datetime.timedelta(days=15),
                        observed_condition=cond,
                        notes=f"Initial survey logged for {s.name}."
                    )
                    db.add(insp)

            db.commit()
            print("[SEED] Satellite observations, field photos, scores, and inspections seeded successfully.")

    except Exception as e:
        db.rollback()
        print(f"[SEED ERROR] {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
