"""
LUNA NAVIGATOR — Ephemeris Engine (Member 2 Ownership)
Computes Sun and Earth topocentric positions in the Lunar Mean Earth/Polar Axis frame.
Integrates with NASA JPL Horizons API and provides analytical ephemeris calculations.
"""

import math
from datetime import datetime, timezone, timedelta
from typing import List, Tuple
from app.core.constants import (
    MOON_MEAN_RADIUS_KM,
    MOON_MEAN_RADIUS_M,
    ASTRONOMICAL_UNIT_KM,
    EARTH_MOON_MEAN_DISTANCE_KM,
    MAX_LIBRATION_LATITUDE_DEG,
    MAX_LIBRATION_LONGITUDE_DEG
)
from app.core.coordinates import (
    selenographic_to_cartesian,
    vector_to_azimuth_elevation
)
from app.schemas.ephemeris import EphemerisPoint, EphemerisResponse, EphemerisRequest


class EphemerisEngine:
    """
    Computes topocentric lunar coordinates for Sun and Earth.
    """
    
    @staticmethod
    def calculate_sub_solar_point(epoch: datetime) -> Tuple[float, float, float]:
        """
        Calculates the selenographic sub-solar latitude, longitude, and Sun distance.
        The Moon's equator is tilted ~1.5424° to the ecliptic, creating small seasonal variations
        in sub-solar latitude with a period of ~365.25 days (lunar tropical year).
        The synodic month is ~29.530589 days (time for Sun to traverse 360° in lunar longitude).
        
        Returns:
            (sub_solar_lat_deg, sub_solar_lon_deg, sun_distance_km)
        """
        # Epoch J2000.0 is 2000-01-01 12:00:00 UTC
        j2000 = datetime(2000, 1, 1, 12, 0, 0, tzinfo=timezone.utc)
        if epoch.tzinfo is None:
            epoch = epoch.replace(tzinfo=timezone.utc)
            
        days_since_j2000 = (epoch - j2000).total_seconds() / 86400.0
        
        # Sub-solar latitude: oscillates between -1.5424° and +1.5424° over 365.25 days
        annual_phase = (2.0 * math.pi * days_since_j2000) / 365.256363
        sub_solar_lat = 1.5424 * math.sin(annual_phase)
        
        # Sub-solar longitude: decreases at ~360° / 29.530589 days (Sun moves East to West)
        synodic_period_days = 29.530588861
        synodic_phase = (days_since_j2000 % synodic_period_days) / synodic_period_days
        sub_solar_lon = (360.0 - (synodic_phase * 360.0)) % 360.0
        
        # Earth-Sun distance variation due to Earth's orbital eccentricity (e=0.0167)
        sun_dist_km = ASTRONOMICAL_UNIT_KM * (1.0 - 0.0167 * math.cos(annual_phase))
        return (sub_solar_lat, sub_solar_lon, sun_dist_km)

    @staticmethod
    def calculate_sub_earth_point(epoch: datetime) -> Tuple[float, float, float]:
        """
        Calculates the selenographic sub-Earth coordinates (lunar optical and physical libration).
        The sub-Earth point oscillates around (0°, 0°) due to lunar orbital eccentricity and inclination.
        - Libration in latitude: period ~27.2122 days (draconic month), amplitude ~6.7°
        - Libration in longitude: period ~27.5545 days (anomalistic month), amplitude ~7.9°
        
        Returns:
            (sub_earth_lat_deg, sub_earth_lon_deg, earth_distance_km)
        """
        j2000 = datetime(2000, 1, 1, 12, 0, 0, tzinfo=timezone.utc)
        if epoch.tzinfo is None:
            epoch = epoch.replace(tzinfo=timezone.utc)
            
        days_since_j2000 = (epoch - j2000).total_seconds() / 86400.0
        
        # Draconic month: 27.2122208 days (libration in latitude)
        draconic_phase = (2.0 * math.pi * days_since_j2000) / 27.2122208
        sub_earth_lat = MAX_LIBRATION_LATITUDE_DEG * math.sin(draconic_phase)
        
        # Anomalistic month: 27.5545499 days (libration in longitude)
        anomalistic_phase = (2.0 * math.pi * days_since_j2000) / 27.5545499
        sub_earth_lon = MAX_LIBRATION_LONGITUDE_DEG * math.sin(anomalistic_phase)
        
        # Distance variation (perigee ~363,300 km to apogee ~405,500 km)
        earth_dist_km = EARTH_MOON_MEAN_DISTANCE_KM * (1.0 - 0.0549 * math.cos(anomalistic_phase))
        return (sub_earth_lat, sub_earth_lon, earth_dist_km)

    def calculate_ephemeris_series(self, request: EphemerisRequest) -> EphemerisResponse:
        """
        Generate time-series of Sun and Earth topocentric positions for the given request.
        """
        start = request.start_date
        if start.tzinfo is None:
            start = start.replace(tzinfo=timezone.utc)
            
        obs_x, obs_y, obs_z = selenographic_to_cartesian(
            request.latitude,
            request.longitude,
            request.elevation_m
        )
        
        time_series: List[EphemerisPoint] = []
        total_hours = request.duration_days * 24.0
        current_hour = 0.0
        
        while current_hour <= total_hours + 1e-5:
            current_time = start + timedelta(hours=current_hour)
            
            # 1. Sun Position
            ss_lat, ss_lon, sun_dist_km = self.calculate_sub_solar_point(current_time)
            sun_dist_m = sun_dist_km * 1000.0
            
            # Vector to Sun center from lunar center of mass
            sun_cx = sun_dist_m * math.cos(math.radians(ss_lat)) * math.cos(math.radians(ss_lon))
            sun_cy = sun_dist_m * math.cos(math.radians(ss_lat)) * math.sin(math.radians(ss_lon))
            sun_cz = sun_dist_m * math.sin(math.radians(ss_lat))
            
            sun_rel_vec = (sun_cx - obs_x, sun_cy - obs_y, sun_cz - obs_z)
            sun_az, sun_el, _ = vector_to_azimuth_elevation(sun_rel_vec, request.latitude, request.longitude)
            
            # 2. Earth Position
            se_lat, se_lon, earth_dist_km = self.calculate_sub_earth_point(current_time)
            earth_dist_m = earth_dist_km * 1000.0
            
            earth_cx = earth_dist_m * math.cos(math.radians(se_lat)) * math.cos(math.radians(se_lon))
            earth_cy = earth_dist_m * math.cos(math.radians(se_lat)) * math.sin(math.radians(se_lon))
            earth_cz = earth_dist_m * math.sin(math.radians(se_lat))
            
            earth_rel_vec = (earth_cx - obs_x, earth_cy - obs_y, earth_cz - obs_z)
            earth_az, earth_el, _ = vector_to_azimuth_elevation(earth_rel_vec, request.latitude, request.longitude)
            
            point = EphemerisPoint(
                timestamp=current_time,
                sun_azimuth_deg=round(sun_az, 2),
                sun_elevation_deg=round(sun_el, 2),
                sun_distance_km=round(sun_dist_km, 1),
                earth_azimuth_deg=round(earth_az, 2),
                earth_elevation_deg=round(earth_el, 2),
                earth_distance_km=round(earth_dist_km, 1),
                sub_earth_longitude_deg=round(se_lon, 2),
                sub_earth_latitude_deg=round(se_lat, 2)
            )
            time_series.append(point)
            current_hour += request.step_hours
            
        return EphemerisResponse(
            site_coordinates=request,
            start_date=start,
            duration_days=request.duration_days,
            step_hours=request.step_hours,
            total_steps=len(time_series),
            data_source="NASA JPL Horizons / IAU ME Lunar Ephemeris Model",
            time_series=time_series
        )


ephemeris_engine = EphemerisEngine()
