"""
LUNA NAVIGATOR — Candidate Sites Data Access
"""

import json
import os
from typing import List, Optional
from app.core.config import settings
from app.schemas.sites import SiteSchema


def load_candidate_sites() -> List[SiteSchema]:
    """
    Load validated lunar south pole landing sites from local dataset file.
    """
    path = settings.CANDIDATE_SITES_PATH
    if not os.path.exists(path):
        # Fallback to absolute or relative scratch path
        alt_path = os.path.join(os.path.dirname(__file__), "..", "..", "..", "datasets", "sample", "candidate_sites.json")
        if os.path.exists(alt_path):
            path = alt_path
        else:
            raise FileNotFoundError(f"Candidate sites dataset not found at {path} or {alt_path}")
            
    with open(path, "r", encoding="utf-8") as f:
        raw_data = json.load(f)
        
    return [SiteSchema(**site) for site in raw_data]


def get_site_by_id(site_id: str) -> Optional[SiteSchema]:
    """
    Find candidate site by unique identifier.
    """
    sites = load_candidate_sites()
    for s in sites:
        if s.id.lower() == site_id.lower():
            return s
    return None
