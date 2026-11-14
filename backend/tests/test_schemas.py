"""
Unit Tests for Pydantic API Schemas & Validation
"""

from datetime import datetime, timezone
import pytest
from pydantic import ValidationError
from app.schemas.common import CoordinatesRequest, DateRangeRequest
from app.schemas.sites import SiteSchema
from app.schemas.recommend import WeightsConfig, ConstraintsConfig


def test_coordinates_request_valid():
    req = CoordinatesRequest(latitude=-89.5, longitude=120.0, elevation_m=500.0)
    assert req.latitude == -89.5
    assert req.longitude == 120.0
    assert req.elevation_m == 500.0


def test_coordinates_request_invalid_latitude():
    with pytest.raises(ValidationError):
        CoordinatesRequest(latitude=-95.0, longitude=0.0)
        
    with pytest.raises(ValidationError):
        CoordinatesRequest(latitude=92.0, longitude=0.0)


def test_date_range_validation():
    # Valid
    req = DateRangeRequest(
        start_date=datetime(2026, 12, 1, 0, 0, 0, tzinfo=timezone.utc),
        duration_days=10.0,
        step_hours=1.0
    )
    assert req.duration_days == 10.0

    # Invalid negative duration
    with pytest.raises(ValidationError):
        DateRangeRequest(
            start_date=datetime(2026, 12, 1, 0, 0, 0, tzinfo=timezone.utc),
            duration_days=-5.0
        )


def test_weights_config_bounds():
    weights = WeightsConfig(
        solar_illumination=0.4,
        earth_communication=0.3,
        slope_safety=0.2,
        elevation_advantage=0.1
    )
    assert weights.solar_illumination == 0.4
    
    # Negative weight should fail
    with pytest.raises(ValidationError):
        WeightsConfig(solar_illumination=-0.2)
