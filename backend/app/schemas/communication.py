"""
LUNA NAVIGATOR — Earth Communication Schemas
"""

from datetime import datetime
from typing import List
from pydantic import BaseModel, Field
from app.schemas.common import CoordinatesRequest, DateRangeRequest


class CommunicationRequest(CoordinatesRequest, DateRangeRequest):
    min_comm_elevation_deg: float = Field(
        default=0.5,
        ge=-5.0,
        le=15.0,
        description="Minimum elevation angle above local horizon for viable DTE radio link"
    )
    use_terrain_horizon: bool = Field(
        default=True,
        description="Whether to evaluate terrain masking using LOLA elevation models"
    )
    antenna_height_m: float = Field(
        default=2.5,
        ge=0.0,
        le=50.0,
        description="Antenna phase center height above ground (meters)"
    )


class CommunicationPoint(BaseModel):
    timestamp: datetime
    earth_azimuth_deg: float
    earth_elevation_deg: float
    terrain_horizon_elevation_deg: float
    is_earth_visible: bool
    link_status: str  # "DIRECT_LINE_OF_SIGHT", "TERRAIN_BLOCKED", "BELOW_MIN_ELEVATION"
    earth_apparent_diameter_deg: float


class CommunicationResponse(BaseModel):
    latitude: float
    longitude: float
    start_date: datetime
    duration_days: float
    step_hours: float
    communication_availability_percentage: float
    total_visible_hours: float
    total_blocked_hours: float
    longest_continuous_comm_window_hours: float
    longest_continuous_blackout_hours: float
    time_series: List[CommunicationPoint]
