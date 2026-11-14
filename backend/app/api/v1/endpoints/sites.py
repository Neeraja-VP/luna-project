"""
Candidate Sites Endpoints
"""
from typing import List
from fastapi import APIRouter, HTTPException
from app.core.sites_catalog import load_candidate_sites, get_site_by_id
from app.schemas.sites import SiteSchema

router = APIRouter()


@router.get("/sites", response_model=List[SiteSchema], tags=["Landing Sites"])
def list_sites():
    """
    Retrieve all characterized lunar south-pole landing candidate sites.
    """
    try:
        return load_candidate_sites()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sites/{site_id}", response_model=SiteSchema, tags=["Landing Sites"])
def get_site(site_id: str):
    """
    Retrieve specific candidate site by unique identifier.
    """
    site = get_site_by_id(site_id)
    if not site:
        raise HTTPException(status_code=404, detail=f"Candidate site '{site_id}' not found.")
    return site
