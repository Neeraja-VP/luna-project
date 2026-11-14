/**
 * LUNA NAVIGATOR — Coordinate Transformations & Polar Math
 * Adheres to IAU Lunar Mean Earth / Polar Axis (ME) frame conventions.
 */

export const MOON_MEAN_RADIUS_KM = 1737.4;
export const MOON_MEAN_RADIUS_M = 1737400.0;

/**
 * Projects selenographic latitude and longitude into 2D canvas coordinates
 * for the Lunar South Pole (latitudes -80° to -90°).
 * 
 * In South Pole polar stereographic projection:
 * - Center of projection: South Pole (-90° lat)
 * - Radial distance r is proportional to colatitude: (90° - |latitude|)
 * - Longitude 0° points up (toward Earth / Prime Meridian)
 * 
 * @param {number} latitude - Selenographic latitude (-90 to -80 deg)
 * @param {number} longitude - Selenographic longitude (0 to 360 deg or -180 to 180 deg)
 * @param {number} cx - Center X on canvas (px)
 * @param {number} cy - Center Y on canvas (px)
 * @param {number} maxRadiusPx - Radius in pixels corresponding to -80° latitude
 * @returns {{ x: number, y: number, r: number, thetaRad: number }}
 */
export function polarProject(latitude, longitude, cx, cy, maxRadiusPx) {
  const colatitude = 90.0 - Math.abs(latitude); // 0 at pole, 10 at -80°
  const normalizedRadius = Math.max(0, Math.min(colatitude / 10.0, 1.2));
  const r = normalizedRadius * maxRadiusPx;

  // Normalize longitude to [0, 360)
  const normLon = ((longitude % 360) + 360) % 360;
  // Rotate so 0° (Prime Meridian / Sub-Earth) points up (-Y direction)
  const thetaRad = ((normLon - 90.0) * Math.PI) / 180.0;

  const x = cx + r * Math.cos(thetaRad);
  const y = cy + r * Math.sin(thetaRad);

  return { x, y, r, thetaRad };
}

/**
 * Inverses 2D canvas coordinates back into selenographic latitude and longitude.
 * 
 * @param {number} x - Canvas X
 * @param {number} y - Canvas Y
 * @param {number} cx - Center X
 * @param {number} cy - Center Y
 * @param {number} maxRadiusPx - Max radius corresponding to -80°
 * @returns {{ latitude: number, longitude: number }}
 */
export function polarUnproject(x, y, cx, cy, maxRadiusPx) {
  const dx = x - cx;
  const dy = y - cy;
  const r = Math.sqrt(dx * dx + dy * dy);
  const colatitude = (r / maxRadiusPx) * 10.0;
  const latitude = Math.max(-90.0, -90.0 + colatitude);

  let angleDeg = (Math.atan2(dy, dx) * 180.0) / Math.PI + 90.0;
  angleDeg = ((angleDeg % 360) + 360) % 360;

  return {
    latitude: Math.round(latitude * 100) / 100,
    longitude: Math.round(angleDeg * 10) / 10,
  };
}

/**
 * Format latitude to standard selenographic string (e.g. "89.78° S")
 */
export function formatLatitude(lat) {
  if (lat === null || lat === undefined || isNaN(lat)) return '—';
  const hemi = lat < 0 ? 'S' : lat > 0 ? 'N' : '';
  return `${Math.abs(lat).toFixed(2)}° ${hemi}`.trim();
}

/**
 * Format longitude to standard selenographic string (e.g. "125.0° E")
 */
export function formatLongitude(lon) {
  if (lon === null || lon === undefined || isNaN(lon)) return '—';
  const norm = ((lon % 360) + 360) % 360;
  return `${norm.toFixed(1)}° E`;
}

/**
 * Calculates surface distance in kilometers between two selenographic points
 * using the Haversine formula on the mean lunar sphere (R = 1737.4 km).
 */
export function lunarHaversineDistanceKm(lat1, lon1, lat2, lon2) {
  const phi1 = (lat1 * Math.PI) / 180.0;
  const phi2 = (lat2 * Math.PI) / 180.0;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180.0;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180.0;

  const a =
    Math.sin(deltaPhi / 2.0) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2.0) ** 2;
  const c = 2.0 * Math.atan2(Math.sqrt(a), Math.sqrt(1.0 - a));

  return MOON_MEAN_RADIUS_KM * c;
}
