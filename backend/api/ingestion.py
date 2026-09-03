from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.db.session import get_db
from backend.api.deps import require_role
from backend.ingestion.satellite_gee_ingest import run_satellite_ingestion_cycle

router = APIRouter(prefix="/ingestion", tags=["Data Ingestion"])

@router.post("/satellite-pull")
def trigger_manual_satellite_pull(
    current_user = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """
    Admin-only endpoint to trigger an immediate manual satellite ingestion cycle.
    Enforces RBAC: returns 403 for non-admin officers.
    """
    summary = run_satellite_ingestion_cycle(db, is_manual=True)
    return {
        "status": "success",
        "triggered_by": current_user.username,
        "summary": summary
    }
