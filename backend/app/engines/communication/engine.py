"""
LUNA NAVIGATOR — Earth Communication Engine (Joint Member 2 & 3 Integration)
Calculates Direct-to-Earth (DTE) visibility and libration dynamics accounting for terrain obstruction.
"""

from typing import List
from app.core.constants import EARTH_ANGULAR_RADIUS_LUNAR_SKY_DEG
from app.engines.ephemeris.engine import ephemeris_engine
from app.engines.terrain.horizon import terrain_engine
from app.schemas.ephemeris import EphemerisRequest
from app.schemas.terrain import TerrainHorizonRequest
from app.schemas.communication import (
    CommunicationRequest,
    CommunicationPoint,
    CommunicationResponse
)


class CommunicationEngine:
    """
    Evaluates Earth line-of-sight and telecommunications link windows.
    """
    
    def calculate_communication(self, request: CommunicationRequest) -> CommunicationResponse:
        # 1. Ephemeris series
        eph_req = EphemerisRequest(
            latitude=request.latitude,
            longitude=request.longitude,
            elevation_m=request.elevation_m,
            start_date=request.start_date,
            duration_days=request.duration_days,
            step_hours=request.step_hours
        )
        eph_res = ephemeris_engine.calculate_ephemeris_series(eph_req)
        
        # 2. Local terrain horizon mask
        terrain_horizon = None
        if request.use_terrain_horizon:
            terr_req = TerrainHorizonRequest(
                latitude=request.latitude,
                longitude=request.longitude,
                elevation_m=request.elevation_m,
                observer_height_m=request.antenna_height_m
            )
            terrain_horizon = terrain_engine.generate_horizon_profile(terr_req)
            
        time_series: List[CommunicationPoint] = []
        visible_count = 0
        current_comm_run = 0.0
        max_comm_run = 0.0
        current_blackout_run = 0.0
        max_blackout_run = 0.0
        
        for pt in eph_res.time_series:
            earth_az = pt.earth_azimuth_deg
            earth_el = pt.earth_elevation_deg
            
            horizon_el = 0.0
            if terrain_horizon:
                horizon_el = terrain_engine.get_horizon_elevation_at_azimuth(terrain_horizon, earth_az)
                
            # Line of Sight Criteria:
            # 1. Earth center must be above local terrain horizon
            # 2. Earth elevation must satisfy minimum ground station mask
            effective_cutoff = max(horizon_el, request.min_comm_elevation_deg)
            is_visible = earth_el > effective_cutoff
            
            if is_visible:
                link_status = "DIRECT_LINE_OF_SIGHT"
                visible_count += 1
                current_comm_run += request.step_hours
                if current_comm_run > max_comm_run:
                    max_comm_run = current_comm_run
                current_blackout_run = 0.0
            else:
                if earth_el <= horizon_el:
                    link_status = "TERRAIN_BLOCKED"
                else:
                    link_status = "BELOW_MIN_ELEVATION"
                    
                current_blackout_run += request.step_hours
                if current_blackout_run > max_blackout_run:
                    max_blackout_run = current_blackout_run
                current_comm_run = 0.0
                
            time_series.append(CommunicationPoint(
                timestamp=pt.timestamp,
                earth_azimuth_deg=earth_az,
                earth_elevation_deg=earth_el,
                terrain_horizon_elevation_deg=round(horizon_el, 2),
                is_earth_visible=is_visible,
                link_status=link_status,
                earth_apparent_diameter_deg=round(EARTH_ANGULAR_RADIUS_LUNAR_SKY_DEG * 2.0, 2)
            ))
            
        total_steps = len(time_series)
        comm_pct = round((visible_count / total_steps * 100.0), 1) if total_steps > 0 else 0.0
        total_visible_hours = round(visible_count * request.step_hours, 1)
        total_blocked_hours = round((total_steps - visible_count) * request.step_hours, 1)
        
        return CommunicationResponse(
            latitude=request.latitude,
            longitude=request.longitude,
            start_date=request.start_date,
            duration_days=request.duration_days,
            step_hours=request.step_hours,
            communication_availability_percentage=comm_pct,
            total_visible_hours=total_visible_hours,
            total_blocked_hours=total_blocked_hours,
            longest_continuous_comm_window_hours=round(max_comm_run, 1),
            longest_continuous_blackout_hours=round(max_blackout_run, 1),
            time_series=time_series
        )


communication_engine = CommunicationEngine()
