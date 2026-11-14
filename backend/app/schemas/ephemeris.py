"""
LUNA NAVIGATOR — Ephemeris Request and Response Schemas
"""

from datetime import datetime
from typing import List
from pydantic import BaseModel, Field
from app.schemas.common import CoordinatesRequest, DateRangeRequest


class EphemerisRequest(CoordinatesRequest, DateRangeRequest):
    """
    Request parameters for calculating topocentric celestial positions.
    """
    pass


class EphemerisPoint(BaseModel):
    timestamp: datetime = Field(..., description="UTC calculation epoch")
    sun_azimuth_deg: float = Field(..., description="Solar azimuth clockwise from Lunar North [0 to 360)")
    sun_elevation_deg: float = Field(..., description="Solar elevation above local horizon plane")
    sun_distance_km: float = Field(..., description="Distance to Sun center in kilometers")
    earth_azimuth_deg: float = Field(..., description="Earth azimuth clockwise from Lunar North [0 to 360)")
    earth_elevation_deg: float = Field(..., description="Earth elevation above local horizon plane")
    earth_distance_km: float = Field(..., description="Distance to Earth center in kilometers")
    sub_earth_longitude_deg: float = Field(..., description="Selenographic longitude of sub-Earth point (libration)")
    sub_earth_latitude_deg: float = Field(..., description="Selenographic latitude of sub-Earth point (libration)")


class EphemerisResponse(BaseModel):
    site_coordinates: CoordinatesRequest
    start_date: datetime
    duration_days: float
    step_hours: float
    total_steps: int
    data_source: str = "NASA JPL Horizons Web API / DE440"
    time_series: List[EphemerisPoint]
