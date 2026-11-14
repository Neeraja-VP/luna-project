"""
Ephemeris Endpoints (Member 2 Ownership)
"""
from fastapi import APIRouter, HTTPException
from app.engines.ephemeris.engine import ephemeris_engine
from app.schemas.ephemeris import EphemerisRequest, EphemerisResponse

router = APIRouter()


@router.post("/ephemeris", response_model=EphemerisResponse, tags=["Orbital Mechanics"])
def calculate_ephemeris(request: EphemerisRequest):
    """
    Calculate topocentric Sun and Earth azimuth, elevation, and distance time series
    for a lunar surface site over a specified mission window.
    """
    try:
        return ephemeris_engine.calculate_ephemeris_series(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ephemeris calculation failed: {str(e)}")
