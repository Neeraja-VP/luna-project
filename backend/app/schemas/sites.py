"""
LUNA NAVIGATOR — Candidate Sites Schemas
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class SiteSchema(BaseModel):
    id: str = Field(..., description="Unique alphanumeric identifier for candidate site")
    name: str = Field(..., description="Official IAU or mission planning feature name")
    region: str = Field(..., description="Lunar South Pole geographic region")
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Selenographic latitude (deg)")
    longitude: float = Field(..., ge=-180.0, le=360.0, description="Selenographic longitude (deg)")
    elevation_m: float = Field(..., description="Elevation above mean lunar radius (m)")
    slope_degrees: float = Field(..., ge=0.0, le=90.0, description="Mean surface slope gradient (deg)")
    description: str = Field(..., description="Geological and topographic characterization")
    scientific_interest: str = Field(..., description="Primary science objectives and resources")
    primary_advantages: List[str] = Field(default_factory=list, description="Key operational advantages")
    primary_challenges: List[str] = Field(default_factory=list, description="Primary hazards or constraints")
    target_mission_class: List[str] = Field(default_factory=list, description="Applicable mission architectures")


class SiteListResponse(BaseModel):
    total_sites: int
    sites: List[SiteSchema]
