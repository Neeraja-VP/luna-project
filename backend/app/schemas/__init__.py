"""
LUNA NAVIGATOR — Shared API Schemas Module
"""

from app.schemas.common import CoordinatesRequest, DateRangeRequest, ErrorResponse
from app.schemas.sites import SiteSchema, SiteListResponse
from app.schemas.ephemeris import EphemerisRequest, EphemerisPoint, EphemerisResponse
from app.schemas.terrain import TerrainHorizonRequest, HorizonPoint, TerrainHorizonResponse
from app.schemas.illumination import IlluminationRequest, IlluminationPoint, IlluminationResponse
from app.schemas.communication import CommunicationRequest, CommunicationPoint, CommunicationResponse
from app.schemas.compare import CompareRequest, SiteComparisonMetrics, CompareResponse
from app.schemas.recommend import (
    WeightsConfig,
    ConstraintsConfig,
    RecommendRequest,
    RankedSite,
    DisqualifiedSite,
    RecommendResponse
)
from app.schemas.simulation import SimulationRequest, PowerPoint, SimulationResponse

__all__ = [
    "CoordinatesRequest",
    "DateRangeRequest",
    "ErrorResponse",
    "SiteSchema",
    "SiteListResponse",
    "EphemerisRequest",
    "EphemerisPoint",
    "EphemerisResponse",
    "TerrainHorizonRequest",
    "HorizonPoint",
    "TerrainHorizonResponse",
    "IlluminationRequest",
    "IlluminationPoint",
    "IlluminationResponse",
    "CommunicationRequest",
    "CommunicationPoint",
    "CommunicationResponse",
    "CompareRequest",
    "SiteComparisonMetrics",
    "CompareResponse",
    "WeightsConfig",
    "ConstraintsConfig",
    "RecommendRequest",
    "RankedSite",
    "DisqualifiedSite",
    "RecommendResponse",
    "SimulationRequest",
    "PowerPoint",
    "SimulationResponse"
]
