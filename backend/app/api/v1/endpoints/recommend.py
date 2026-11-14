"""
Site Recommendation & Ranking Endpoints (Member 4 Ownership)
"""
from fastapi import APIRouter, HTTPException
from app.engines.recommendation.engine import recommendation_engine
from app.schemas.recommend import RecommendRequest, RecommendResponse

router = APIRouter()


@router.post("/recommend", response_model=RecommendResponse, tags=["Decision Support"])
def rank_and_recommend_sites(request: RecommendRequest):
    """
    Multi-Criteria Decision Analysis (MCDA) ranking of candidate lunar landing sites
    based on customizable operational weights and hard mission constraints.
    """
    try:
        return recommendation_engine.recommend_sites(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Site recommendation failed: {str(e)}")
