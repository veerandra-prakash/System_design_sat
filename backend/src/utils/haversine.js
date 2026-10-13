/**
 * Calculate the great-circle distance between two points on the Earth
 * using the Haversine formula.
 *
 * @param {number} lat1 Latitude of point 1 in degrees
 * @param {number} lon1 Longitude of point 1 in degrees
 * @param {number} lat2 Latitude of point 2 in degrees
 * @param {number} lon2 Longitude of point 2 in degrees
 * @returns {number} Distance in kilometers rounded to 2 decimal places
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  if (
    lat1 === undefined || lon1 === undefined ||
    lat2 === undefined || lon2 === undefined ||
    lat1 === null || lon1 === null ||
    lat2 === null || lon2 === null
  ) {
    return Infinity;
  }

  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 100) / 100;
}

function toRad(degrees) {
  return (degrees * Math.PI) / 180;
}

/**
 * Estimate travel time in minutes based on distance and assumed average speed (e.g. 40 km/h).
 * Note: Actual response time depends on road conditions, traffic, weather, and dispatch decisions.
 *
 * @param {number} distanceKm Distance in kilometers
 * @param {number} avgSpeedKmH Average speed in km/h (default 40 km/h)
 * @returns {number} Approximate ETA in minutes
 */
function estimateETA(distanceKm, avgSpeedKmH = 40) {
  if (!distanceKm || distanceKm === Infinity) return 0;
  const hours = distanceKm / avgSpeedKmH;
  const minutes = Math.max(2, Math.round(hours * 60)); // minimum 2 min buffer
  return minutes;
}

module.exports = {
  calculateDistance,
  estimateETA
};
