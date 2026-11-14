"""
LUNA NAVIGATOR — API v1 Router Aggregator
"""
from fastapi import APIRouter
from app.api.v1.endpoints import (
    health,
    sites,
    ephemeris,
    terrain,
    illumination,
    communication,
    compare,
    recommend,
    simulate
)

api_router = APIRouter()

api_router.include_router(health.router)
api_router.include_router(sites.router)
api_router.include_router(ephemeris.router)
api_router.include_router(terrain.router)
api_router.include_router(illumination.router)
api_router.include_router(communication.router)
api_router.include_router(compare.router)
api_router.include_router(recommend.router)
api_router.include_router(simulate.router)
