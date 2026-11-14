"""
LUNA NAVIGATOR — Planetary & Scientific Physical Constants
Standardized lunar constants based on IAU/IAG and NASA JPL ephemerides.
"""

# Lunar Physical Dimensions
MOON_MEAN_RADIUS_KM: float = 1737.4
MOON_MEAN_RADIUS_M: float = 1737400.0
MOON_EQUATORIAL_RADIUS_KM: float = 1738.1
MOON_POLAR_RADIUS_KM: float = 1736.0
MOON_SURFACE_GRAVITY_M_S2: float = 1.622

# Astronomical Reference Distances
ASTRONOMICAL_UNIT_KM: float = 149597870.7
EARTH_MOON_MEAN_DISTANCE_KM: float = 384400.0
SPEED_OF_LIGHT_KM_S: float = 299792.458

# Solar Radiation & Irradiance
SOLAR_CONSTANT_1AU_W_M2: float = 1361.0
SOLAR_ANGULAR_RADIUS_DEG: float = 0.2667  # ~16 arcmin at 1 AU
SOLAR_ANGULAR_DIAMETER_DEG: float = 0.5333

# Earth Visibility & Libration Constants
EARTH_ANGULAR_RADIUS_LUNAR_SKY_DEG: float = 0.94  # ~1.88 deg diameter
MAX_LIBRATION_LATITUDE_DEG: float = 6.7
MAX_LIBRATION_LONGITUDE_DEG: float = 7.9
MIN_COMM_ELEVATION_THRESHOLD_DEG: float = 0.5  # Typical DTE ground station mask

# Lunar South Pole Bounding Box
SOUTH_POLE_MIN_LATITUDE_DEG: float = -90.0
SOUTH_POLE_MAX_LATITUDE_DEG: float = -80.0
