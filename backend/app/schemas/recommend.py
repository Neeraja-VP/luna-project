"""
LUNA NAVIGATOR — Site Recommendation & MCDA Schemas
"""

from datetime import datetime
from typing import List, Dict, Optional
from pydantic import BaseModel, Field
from app.schemas.common import DateRangeRequest


class WeightsConfig(BaseModel):
    solar_illumination: float = Field(default=0.35, ge=0.0, le=1.0)
    earth_communication: float = Field(default=0.30, ge=0.0, le=1.0)
    slope_safety: float = Field(default=0.20, ge=0.0, le=1.0)
    elevation_advantage: float = Field(default=0.15, ge=0.0, le=1.0)


class ConstraintsConfig(BaseModel):
    min_illumination_percentage: float = Field(default=50.0, ge=0.0, le=100.0)
    min_communication_percentage: float = Field(default=40.0, ge=0.0, le=100.0)
    max_acceptable_slope_degrees: float = Field(default=12.0, ge=1.0, le=45.0)
    max_continuous_shadow_hours: float = Field(default=72.0, ge=0.0, le=700.0)


class RecommendRequest(DateRangeRequest):
    weights: WeightsConfig = Field(default_factory=WeightsConfig)
    constraints: ConstraintsConfig = Field(default_factory=ConstraintsConfig)
    site_ids: Optional[List[str]] = Field(default=None, description="Optional subset of sites to evaluate")


class RankedSite(BaseModel):
    rank: int
    site_id: str
    name: str
    total_score: float = Field(..., ge=0.0, le=100.0)
    is_compliant: bool
    scores_breakdown: Dict[str, float]
    raw_metrics: Dict[str, float]
    explanation: str


class DisqualifiedSite(BaseModel):
    site_id: str
    name: str
    violations: List[str]


class RecommendResponse(BaseModel):
    start_date: datetime
    duration_days: float
    weights_applied: WeightsConfig
    ranking: List[RankedSite]
    disqualified_sites: List[DisqualifiedSite]
