# LUNA NAVIGATOR — Shared API Contract Specification

This document defines the strict REST API contracts for communication between the Frontend (Member 1) and Backend Engines (Members 2, 3, and 4). All endpoints use JSON payloads and validate schemas through Pydantic v2 models.

Base URL: `/api` (or `/api/v1`)

---

## 1. Candidate Sites Catalog

### `GET /api/sites`
Retrieve list of all pre-characterized lunar landing candidate sites.

**Response `200 OK`**:
```json
[
  {
    "id": "shackleton-rim",
    "name": "Shackleton Crater Rim",
    "region": "South Pole Proper",
    "latitude": -89.78,
    "longitude": 125.0,
    "elevation_m": 1240.0,
    "slope_degrees": 8.5,
    "description": "High ridge along the rim of Shackleton Crater...",
    "scientific_interest": "Volatiles prospecting, cryogenic ice preservation...",
    "primary_advantages": ["High solar illumination", "Near-permanent radio LOS to Earth"],
    "primary_challenges": ["Steep crater wall drop-offs nearby"],
    "target_mission_class": ["Artemis III Crewed", "CLPS Commercial Lander"]
  }
]
```

### `GET /api/sites/{site_id}`
Retrieve detailed information for a single candidate site by ID.

**Response `200 OK`**: Single site object as above.
**Response `404 Not Found`**:
```json
{
  "detail": "Site with ID 'unknown-site' not found."
}
```

---

## 2. Ephemeris Engine

### `POST /api/ephemeris`
Calculate Sun and Earth topocentric positions (Azimuth, Elevation, Range) relative to a specific lunar surface coordinate over a given mission window.

**Request Body**:
```json
{
  "latitude": -89.78,
  "longitude": 125.0,
  "elevation_m": 1240.0,
  "start_date": "2026-12-01T00:00:00Z",
  "duration_days": 14.0,
  "step_hours": 2.0
}
```

**Response `200 OK`**:
```json
{
  "site_coordinates": {
    "latitude": -89.78,
    "longitude": 125.0,
    "elevation_m": 1240.0
  },
  "start_date": "2026-12-01T00:00:00Z",
  "duration_days": 14.0,
  "step_hours": 2.0,
  "total_steps": 169,
  "data_source": "NASA JPL Horizons Web API / DE440 ephemeris",
  "time_series": [
    {
      "timestamp": "2026-12-01T00:00:00Z",
      "sun_azimuth_deg": 142.3,
      "sun_elevation_deg": 1.25,
      "sun_distance_km": 147500000.0,
      "earth_azimuth_deg": 310.4,
      "earth_elevation_deg": 4.82,
      "earth_distance_km": 384400.0,
      "sub_earth_longitude_deg": 4.12,
      "sub_earth_latitude_deg": 6.35
    }
  ]
}
```

---

## 3. Terrain Horizon Obstruction

### `POST /api/terrain/horizon`
Calculate the 360-degree local terrain horizon elevation profile from a given surface coordinate using the LOLA digital elevation model (DEM).

**Request Body**:
```json
{
  "latitude": -89.78,
  "longitude": 125.0,
  "elevation_m": 1240.0,
  "max_distance_km": 60.0,
  "azimuth_step_deg": 1.0,
  "observer_height_m": 2.0
}
```

**Response `200 OK`**:
```json
{
  "latitude": -89.78,
  "longitude": 125.0,
  "observer_height_m": 2.0,
  "elevation_datum": "Lunar Sphere R=1737.4 km",
  "horizon_points": [
    {
      "azimuth_deg": 0.0,
      "horizon_elevation_deg": 0.85,
      "obstruction_distance_km": 14.2,
      "blocking_feature": "Rim crest elevation"
    },
    {
      "azimuth_deg": 1.0,
      "horizon_elevation_deg": 0.88,
      "obstruction_distance_km": 14.1,
      "blocking_feature": "Rim crest elevation"
    }
  ],
  "max_horizon_elevation_deg": 3.42,
  "min_horizon_elevation_deg": -0.65
}
```

---

## 4. Solar Illumination Analysis

### `POST /api/illumination`
Calculate geometric and terrain-aware solar illumination status over time for a landing site.

**Request Body**:
```json
{
  "latitude": -89.78,
  "longitude": 125.0,
  "elevation_m": 1240.0,
  "start_date": "2026-12-01T00:00:00Z",
  "duration_days": 14.0,
  "step_hours": 1.0,
  "use_terrain_horizon": true
}
```

**Response `200 OK`**:
```json
{
  "latitude": -89.78,
  "longitude": 125.0,
  "start_date": "2026-12-01T00:00:00Z",
  "duration_days": 14.0,
  "step_hours": 1.0,
  "illumination_percentage": 82.5,
  "total_sunlit_hours": 277.2,
  "total_shadow_hours": 58.8,
  "longest_continuous_sunlight_hours": 142.0,
  "longest_continuous_shadow_hours": 24.0,
  "time_series": [
    {
      "timestamp": "2026-12-01T00:00:00Z",
      "sun_azimuth_deg": 142.3,
      "sun_elevation_deg": 1.25,
      "terrain_horizon_elevation_deg": 0.70,
      "is_sunlit_geometric": true,
      "is_sunlit_terrain": true,
      "solar_flux_w_m2": 1361.0,
      "effective_flux_horizontal_w_m2": 29.68
    }
  ]
}
```

---

## 5. Earth Communication & Visibility

### `POST /api/communication`
Calculate Direct-to-Earth (DTE) radio visibility, accounting for lunar libration and local terrain obstruction.

**Request Body**:
```json
{
  "latitude": -89.78,
  "longitude": 125.0,
  "elevation_m": 1240.0,
  "start_date": "2026-12-01T00:00:00Z",
  "duration_days": 14.0,
  "step_hours": 1.0,
  "min_comm_elevation_deg": 1.0,
  "use_terrain_horizon": true
}
```

**Response `200 OK`**:
```json
{
  "latitude": -89.78,
  "longitude": 125.0,
  "start_date": "2026-12-01T00:00:00Z",
  "duration_days": 14.0,
  "step_hours": 1.0,
  "communication_availability_percentage": 76.4,
  "total_visible_hours": 256.7,
  "total_blocked_hours": 79.3,
  "longest_continuous_comm_window_hours": 110.0,
  "time_series": [
    {
      "timestamp": "2026-12-01T00:00:00Z",
      "earth_azimuth_deg": 310.4,
      "earth_elevation_deg": 4.82,
      "terrain_horizon_elevation_deg": 1.10,
      "is_earth_visible": true,
      "link_status": "DIRECT_LINE_OF_SIGHT",
      "earth_apparent_diameter_deg": 1.88
    }
  ]
}
```

---

## 6. Multi-Site Comparison

### `POST /api/compare`
Side-by-side comparison of multiple candidate landing sites across solar illumination, Earth communication, slope, and topographic metrics.

**Request Body**:
```json
{
  "site_ids": ["shackleton-rim", "connecting-ridge", "malapert-mountain"],
  "start_date": "2026-12-01T00:00:00Z",
  "duration_days": 14.0,
  "step_hours": 2.0
}
```

**Response `200 OK`**:
```json
{
  "start_date": "2026-12-01T00:00:00Z",
  "duration_days": 14.0,
  "sites_evaluated": [
    {
      "site_id": "shackleton-rim",
      "name": "Shackleton Crater Rim",
      "latitude": -89.78,
      "longitude": 125.0,
      "elevation_m": 1240.0,
      "slope_degrees": 8.5,
      "illumination_percentage": 82.5,
      "max_shadow_hours": 24.0,
      "communication_percentage": 76.4,
      "max_comm_blackout_hours": 32.0,
      "overall_suitability_score": 88.4
    }
  ]
}
```

---

## 7. Site Ranking & Recommendation

### `POST /api/recommend`
Rank candidate sites using user-defined Multi-Criteria Decision Analysis (MCDA) weightings and hard operational constraints.

**Request Body**:
```json
{
  "start_date": "2026-12-01T00:00:00Z",
  "duration_days": 14.0,
  "weights": {
    "solar_illumination": 0.35,
    "earth_communication": 0.30,
    "slope_safety": 0.20,
    "elevation_advantage": 0.15
  },
  "constraints": {
    "min_illumination_percentage": 60.0,
    "min_communication_percentage": 50.0,
    "max_acceptable_slope_degrees": 12.0,
    "max_continuous_shadow_hours": 48.0
  }
}
```

**Response `200 OK`**:
```json
{
  "ranking": [
    {
      "rank": 1,
      "site_id": "malapert-mountain",
      "name": "Malapert Mountain (Massif)",
      "total_score": 91.2,
      "is_compliant": true,
      "scores_breakdown": {
        "solar_illumination": 86.0,
        "earth_communication": 98.0,
        "slope_safety": 87.5,
        "elevation_advantage": 100.0
      },
      "explanation": "Ranked #1 primarily due to outstanding Direct-to-Earth communication coverage (98%) and elevated horizon profile above local obstructions."
    }
  ],
  "disqualified_sites": []
}
```

---

## 8. Mission Energy Simulation

### `POST /api/simulate`
Simulate lander/rover electrical power system (EPS), battery State of Charge (SoC), and thermal survival based on calculated solar flux.

**Request Body**:
```json
{
  "site_id": "shackleton-rim",
  "start_date": "2026-12-01T00:00:00Z",
  "duration_days": 14.0,
  "step_hours": 1.0,
  "solar_array_area_m2": 4.5,
  "solar_efficiency": 0.30,
  "solar_tracking_type": "VERTICAL_AZIMUTH_TRACKING",
  "battery_capacity_wh": 5000.0,
  "initial_battery_soc_percent": 100.0,
  "min_safe_soc_percent": 20.0,
  "base_hotel_load_w": 180.0,
  "payload_active_load_w": 120.0,
  "survival_heater_load_w": 90.0
}
```

**Response `200 OK`**:
```json
{
  "site_id": "shackleton-rim",
  "mission_duration_hours": 336.0,
  "min_battery_soc_percent": 42.1,
  "battery_depleted": false,
  "total_energy_generated_kwh": 78.4,
  "total_energy_consumed_kwh": 65.2,
  "time_series": [
    {
      "timestamp": "2026-12-01T00:00:00Z",
      "solar_generation_w": 285.4,
      "total_load_w": 300.0,
      "net_power_w": -14.6,
      "battery_soc_percent": 99.7,
      "battery_stored_wh": 4985.4,
      "is_deficit": true
    }
  ]
}
```

---

## 9. Common Error Formats

All API errors return a standard JSON schema:
```json
{
  "error": {
    "code": "INVALID_COORDINATES",
    "message": "Latitude must be between -90.0 and +90.0 degrees.",
    "field": "latitude"
  }
}
```
HTTP status codes used:
- `400 Bad Request`: Validation failure or parameter out of bounds
- `404 Not Found`: Site or resource does not exist
- `502 Bad Gateway`: External upstream API failure (e.g. JPL Horizons unreachable)
- `500 Internal Server Error`: Unhandled compute error
