from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.db.session import get_db
from backend.api.deps import get_current_user
from backend.ingestion.stubs.inspection_feedback_stub import InspectionFeedbackLoopStub

router = APIRouter(prefix="/inspections", tags=["Field Inspections"])

class InspectionCreateSchema(BaseModel):
    structure_id: int
    observed_condition: str  # intact, minor_damage, major_damage, non_functional
    notes: str = ""

@router.post("")
def log_field_inspection(
    payload: InspectionCreateSchema,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Log officer ground-truth inspection outcome.
    Feeds real ground-truth outcomes into the ML retraining loop.
    """
    stub = InspectionFeedbackLoopStub()
    res = stub.log_inspection_outcome(
        db_session=db,
        structure_id=payload.structure_id,
        officer_id=current_user.id,
        verified_condition=payload.observed_condition,
        notes=payload.notes
    )
    res["logged_by"] = current_user.username
    return res
