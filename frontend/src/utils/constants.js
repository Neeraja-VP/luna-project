/**
 * LUNA NAVIGATOR — Frontend Application Constants
 */

export const DEFAULT_MISSION_CONFIG = {
  startDate: '2026-12-01T00:00',
  durationDays: 14,
  stepHours: 3,
  useTerrainHorizon: true,
  mastHeightM: 2.0,
  minCommElevationDeg: 0.5,
};

export const DEFAULT_MCDA_WEIGHTS = {
  solar_illumination: 0.35,
  earth_communication: 0.30,
  slope_safety: 0.20,
  elevation_advantage: 0.15,
};

export const DEFAULT_CONSTRAINTS = {
  min_illumination_percentage: 40.0,
  min_communication_percentage: 30.0,
  max_acceptable_slope_degrees: 12.0,
  max_continuous_shadow_hours: 80.0,
};

export const DEFAULT_SIMULATION_CONFIG = {
  solar_array_area_m2: 4.5,
  solar_efficiency: 0.30,
  solar_tracking_type: 'VERTICAL_AZIMUTH_TRACKING',
  battery_capacity_wh: 5000.0,
  initial_battery_soc_percent: 100.0,
  min_safe_soc_percent: 20.0,
  base_hotel_load_w: 150.0,
  payload_active_load_w: 100.0,
  survival_heater_load_w: 80.0,
};
