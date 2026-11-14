"""
Site Comparison Endpoints (Member 4 Ownership)
"""
from fastapi import APIRouter, HTTPException
from app.engines.recommendation.engine import recommendation_engine
from app.schemas.compare import CompareRequest, CompareResponse

router = APIRouter()


@router.post("/compare", response_model=CompareResponse, tags=["Decision Support"])
def compare_candidate_sites(request: CompareRequest):
    """
    Side-by-side comparison of multiple candidate landing sites across solar illumination,
    Earth communications, slope, and elevation metrics.
    """
    try:
        return recommendation_engine.compare_sites(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Site comparison failed: {str(e)}")
