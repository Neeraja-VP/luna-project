"""
Solar Illumination Endpoints (Joint Member 2 & 3 Integration)
"""
from fastapi import APIRouter, HTTPException
from app.engines.illumination.engine import illumination_engine
from app.schemas.illumination import IlluminationRequest, IlluminationResponse

router = APIRouter()


@router.post("/illumination", response_model=IlluminationResponse, tags=["Illumination"])
def compute_illumination(request: IlluminationRequest):
    """
    Calculate geometric and terrain-aware solar illumination, shadow durations,
    and horizontal solar flux over time.
    """
    try:
        return illumination_engine.calculate_illumination(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Illumination calculation failed: {str(e)}")
