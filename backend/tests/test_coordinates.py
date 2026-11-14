"""
Unit Tests for Lunar Coordinate Math & Topocentric Transformations
"""

import math
import pytest
from app.core.constants import MOON_MEAN_RADIUS_M
from app.core.coordinates import (
    selenographic_to_cartesian,
    cartesian_to_selenographic,
    get_topocentric_basis,
    vector_to_azimuth_elevation,
    lunar_curvature_drop,
    great_circle_distance_m
)


def test_selenographic_to_cartesian_equator():
    # Equator (0, 0) with 0 elevation should lie on +X axis
    x, y, z = selenographic_to_cartesian(0.0, 0.0, 0.0)
    assert pytest.approx(x, abs=1.0) == MOON_MEAN_RADIUS_M
    assert pytest.approx(y, abs=1.0) == 0.0
    assert pytest.approx(z, abs=1.0) == 0.0


def test_selenographic_to_cartesian_south_pole():
    # South Pole (-90, 0) should lie on -Z axis
    x, y, z = selenographic_to_cartesian(-90.0, 0.0, 0.0)
    assert pytest.approx(x, abs=1.0) == 0.0
    assert pytest.approx(y, abs=1.0) == 0.0
    assert pytest.approx(z, abs=1.0) == -MOON_MEAN_RADIUS_M


def test_cartesian_to_selenographic_roundtrip():
    # Verify reversible transformation
    test_lat = -89.5
    test_lon = 125.0
    test_elev = 1500.0
    
    x, y, z = selenographic_to_cartesian(test_lat, test_lon, test_elev)
    lat_res, lon_res, elev_res = cartesian_to_selenographic(x, y, z)
    
    assert pytest.approx(lat_res, abs=1e-5) == test_lat
    assert pytest.approx(lon_res, abs=1e-5) == test_lon
    assert pytest.approx(elev_res, abs=1e-3) == test_elev


def test_topocentric_basis_orthonormality():
    # Verify East, North, Up form an orthonormal basis
    east, north, up = get_topocentric_basis(-85.0, 45.0)
    
    # Unit lengths
    def mag(v):
        return math.sqrt(v[0]**2 + v[1]**2 + v[2]**2)
        
    def dot(u, v):
        return u[0]*v[0] + u[1]*v[1] + u[2]*v[2]
        
    assert pytest.approx(mag(east), abs=1e-6) == 1.0
    assert pytest.approx(mag(north), abs=1e-6) == 1.0
    assert pytest.approx(mag(up), abs=1e-6) == 1.0
    
    # Orthogonality
    assert pytest.approx(dot(east, north), abs=1e-6) == 0.0
    assert pytest.approx(dot(east, up), abs=1e-6) == 0.0
    assert pytest.approx(dot(north, up), abs=1e-6) == 0.0


def test_vector_to_azimuth_elevation():
    lat = -85.0
    lon = 0.0
    east, north, up = get_topocentric_basis(lat, lon)
    
    # Directly overhead along Up vector -> Elevation should be 90°
    target_up = (up[0] * 1000.0, up[1] * 1000.0, up[2] * 1000.0)
    az, el, r = vector_to_azimuth_elevation(target_up, lat, lon)
    assert pytest.approx(el, abs=0.1) == 90.0
    
    # Directly toward North vector -> Elevation 0°, Azimuth 0°
    target_north = (north[0] * 1000.0, north[1] * 1000.0, north[2] * 1000.0)
    az_n, el_n, _ = vector_to_azimuth_elevation(target_north, lat, lon)
    assert pytest.approx(el_n, abs=0.1) == 0.0
    assert pytest.approx(az_n, abs=0.1) == 0.0
    
    # Directly toward East vector -> Elevation 0°, Azimuth 90°
    target_east = (east[0] * 1000.0, east[1] * 1000.0, east[2] * 1000.0)
    az_e, el_e, _ = vector_to_azimuth_elevation(target_east, lat, lon)
    assert pytest.approx(el_e, abs=0.1) == 0.0
    assert pytest.approx(az_e, abs=0.1) == 90.0


def test_lunar_curvature_drop():
    # At 30 km ground distance, drop is ~ s^2 / (2 * R_moon) ~ 30000^2 / (2 * 1737400) ~ 259.0 meters
    drop = lunar_curvature_drop(30000.0)
    assert pytest.approx(drop, abs=1.0) == 259.0
