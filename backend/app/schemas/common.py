"""
LUNA NAVIGATOR — Shared Base Schemas
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class CoordinatesRequest(BaseModel):
    latitude: float = Field(
        ...,
        ge=-90.0,
        le=90.0,
        description="Lunar latitude in degrees [-90.0 to +90.0], negative for South Pole"
    )
    longitude: float = Field(
        ...,
        ge=-180.0,
        le=360.0,
        description="Lunar longitude in degrees, East positive [0.0 to 360.0) or [-180.0 to +180.0]"
    )
    elevation_m: float = Field(
        default=0.0,
        description="Elevation in meters above standard lunar reference sphere (R=1737.4 km)"
    )


class DateRangeRequest(BaseModel):
    start_date: datetime = Field(
        ...,
        description="Mission evaluation start time (ISO 8601 UTC format, e.g. 2026-12-01T00:00:00Z)"
    )
    duration_days: float = Field(
        default=14.0,
        gt=0.0,
        le=365.0,
        description="Mission duration in Earth days"
    )
    step_hours: float = Field(
        default=1.0,
        gt=0.05,
        le=168.0,
        description="Calculation time step in hours"
    )


class ErrorDetail(BaseModel):
    code: str
    message: str
    field: Optional[str] = None


class ErrorResponse(BaseModel):
    error: ErrorDetail
