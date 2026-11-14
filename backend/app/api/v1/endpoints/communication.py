"""
Earth Communication Endpoints (Joint Member 2 & 3 Integration)
"""
from fastapi import APIRouter, HTTPException
from app.engines.communication.engine import communication_engine
from app.schemas.communication import CommunicationRequest, CommunicationResponse

router = APIRouter()


@router.post("/communication", response_model=CommunicationResponse, tags=["Telecommunications"])
def compute_communication(request: CommunicationRequest):
    """
    Calculate Direct-to-Earth (DTE) communication visibility, libration oscillation,
    and terrain blocking intervals.
    """
    try:
        return communication_engine.calculate_communication(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Communication link calculation failed: {str(e)}")
