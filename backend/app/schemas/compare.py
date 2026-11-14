"""
LUNA NAVIGATOR — Site Comparison Schemas
"""

from datetime import datetime
from typing import List
from pydantic import BaseModel, Field
from app.schemas.common import DateRangeRequest


class CompareRequest(DateRangeRequest):
    site_ids: List[str] = Field(
        ...,
        min_length=2,
        max_length=10,
        description="List of candidate site IDs to compare"
    )


class SiteComparisonMetrics(BaseModel):
    site_id: str
    name: str
    latitude: float
    longitude: float
    elevation_m: float
    slope_degrees: float
    illumination_percentage: float
    max_shadow_hours: float
    communication_percentage: float
    max_comm_blackout_hours: float
    overall_suitability_score: float


class CompareResponse(BaseModel):
    start_date: datetime
    duration_days: float
    sites_evaluated: List[SiteComparisonMetrics]
