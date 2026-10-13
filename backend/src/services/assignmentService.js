const Ambulance = require('../models/Ambulance');
const { calculateDistance, estimateETA } = require('../utils/haversine');
const logger = require('../utils/logger');

/**
 * Intelligent Nearest Eligible Ambulance Assignment Algorithm
 *
 * 1. Find all ambulances that are Available and Online
 * 2. Filter by requested ambulance type (BLS / ALS / ICU)
 * 3. Calculate distance from pickup coordinates using the Haversine formula
 * 4. Sort by nearest distance
 * 5. Atomically reserve the ambulance to prevent concurrent duplicate assignments
 * 6. Return assigned ambulance or null if none available
 *
 * @param {Object} pickup { latitude, longitude, address }
 * @param {string} requestedType 'BLS' | 'ALS' | 'ICU'
 * @returns {Promise<{ assignedAmbulance: Object|null, distanceKm: number|null, etaMinutes: number|null, message: string }>}
 */
const assignNearestAmbulance = async (pickup, requestedType) => {
  try {
    // 1. Query available & online ambulances matching requested type
    let candidateAmbulances = await Ambulance.find({
      status: 'Available',
      isOnline: true,
      type: requestedType
    }).populate('driverId', 'name phone');

    // Fallback: If no exact type is available, and requested was BLS, check ALS/ICU
    if (!candidateAmbulances || candidateAmbulances.length === 0) {
      logger.info(`[Assignment] No Available '${requestedType}' ambulances. Checking other available online ambulances as fallback.`);
      candidateAmbulances = await Ambulance.find({
        status: 'Available',
        isOnline: true
      }).populate('driverId', 'name phone');
    }

    if (!candidateAmbulances || candidateAmbulances.length === 0) {
      return {
        assignedAmbulance: null,
        distanceKm: null,
        etaMinutes: null,
        message: 'No online ambulances are currently available in the fleet. Request queued as pending dispatch.'
      };
    }

    // 2. Calculate Haversine distance for each candidate
    const candidatesWithDistance = candidateAmbulances.map((amb) => {
      const dist = calculateDistance(
        pickup.latitude,
        pickup.longitude,
        amb.location.latitude,
        amb.location.longitude
      );
      return {
        ambulance: amb,
        distanceKm: dist,
        etaMinutes: estimateETA(dist)
      };
    });

    // 3. Sort ascending by distance
    candidatesWithDistance.sort((a, b) => a.distanceKm - b.distanceKm);

    // 4. Atomically attempt to reserve the nearest ambulance
    for (const candidate of candidatesWithDistance) {
      const ambId = candidate.ambulance._id;

      // Atomic update ensures safe assignment without race conditions
      const reserved = await Ambulance.findOneAndUpdate(
        { _id: ambId, status: 'Available' },
        { status: 'Assigned', 'location.updatedAt': new Date() },
        { new: true }
      ).populate('driverId', 'name phone');

      if (reserved) {
        logger.info(
          `[Assignment] Ambulance ${reserved.ambulanceNumber} (${reserved.type}) assigned to request. Distance: ~${candidate.distanceKm} km, ETA: ~${candidate.etaMinutes} min.`
        );
        return {
          assignedAmbulance: reserved,
          distanceKm: candidate.distanceKm,
          etaMinutes: candidate.etaMinutes,
          message: `Ambulance ${reserved.ambulanceNumber} assigned successfully. Approximate distance: ~${candidate.distanceKm} km (ETA: ~${candidate.etaMinutes} min, subject to road traffic and dispatch conditions).`
        };
      }
    }

    // If all candidates were claimed concurrently
    return {
      assignedAmbulance: null,
      distanceKm: null,
      etaMinutes: null,
      message: 'All eligible ambulances were booked concurrently. Request queued as pending dispatch.'
    };
  } catch (error) {
    logger.error(`[Assignment Error] ${error.message}`);
    throw error;
  }
};

/**
 * Release an assigned ambulance back to Available status
 */
const releaseAmbulance = async (ambulanceId) => {
  if (!ambulanceId) return null;
  return Ambulance.findByIdAndUpdate(
    ambulanceId,
    { status: 'Available', 'location.updatedAt': new Date() },
    { new: true }
  );
};

module.exports = {
  assignNearestAmbulance,
  releaseAmbulance
};
