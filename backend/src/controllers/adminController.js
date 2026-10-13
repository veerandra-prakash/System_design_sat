const Ambulance = require('../models/Ambulance');
const AmbulanceRequest = require('../models/AmbulanceRequest');
const User = require('../models/User');
const { successResponse } = require('../utils/response');

// @route   GET /api/v1/admin/dashboard
// @access  Private (Admin only)
const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalAmbulances,
      availableAmbulances,
      onTripAmbulances,
      offlineAmbulances,
      pendingRequests,
      activeEmergencies,
      completedRequests,
      cancelledRequests,
      totalUsers,
      totalDrivers,
      recentRequests
    ] = await Promise.all([
      Ambulance.countDocuments(),
      Ambulance.countDocuments({ status: 'Available', isOnline: true }),
      Ambulance.countDocuments({ status: { $in: ['On Trip', 'Assigned'] } }),
      Ambulance.countDocuments({ $or: [{ status: 'Offline' }, { isOnline: false }] }),
      AmbulanceRequest.countDocuments({ status: 'REQUESTED' }),
      AmbulanceRequest.countDocuments({
        status: { $in: ['ACCEPTED', 'DISPATCHED', 'ARRIVING', 'PATIENT_PICKED_UP'] }
      }),
      AmbulanceRequest.countDocuments({ status: 'COMPLETED' }),
      AmbulanceRequest.countDocuments({ status: 'CANCELLED' }),
      User.countDocuments({ role: 'patient' }),
      User.countDocuments({ role: 'driver' }),
      AmbulanceRequest.find()
        .populate('patientId', 'name phone email')
        .populate({
          path: 'ambulanceId',
          populate: { path: 'driverId', select: 'name phone' }
        })
        .sort({ createdAt: -1 })
        .limit(10)
    ]);

    return successResponse(
      res,
      {
        metrics: {
          totalAmbulances,
          availableAmbulances,
          onTripAmbulances,
          offlineAmbulances,
          pendingRequests,
          activeEmergencies,
          completedRequests,
          cancelledRequests,
          totalUsers,
          totalDrivers
        },
        recentRequests
      },
      'Admin dashboard statistics loaded successfully'
    );
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/v1/admin/requests
// @access  Private (Admin only)
const getAllRequestsAdmin = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.status) query.status = req.query.status;
    if (req.query.emergencyType) query.emergencyType = req.query.emergencyType;
    if (req.query.ambulanceType) query.requestedAmbulanceType = req.query.ambulanceType;

    const total = await AmbulanceRequest.countDocuments(query);
    const requests = await AmbulanceRequest.find(query)
      .populate('patientId', 'name email phone emergencyContact')
      .populate({
        path: 'ambulanceId',
        populate: { path: 'driverId', select: 'name phone email' }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return successResponse(
      res,
      {
        requests,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit) || 1,
          limit
        }
      },
      'Admin emergency requests list loaded'
    );
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/v1/admin/ambulances
// @access  Private (Admin only)
const getAllAmbulancesAdmin = async (req, res, next) => {
  try {
    const ambulances = await Ambulance.find()
      .populate('driverId', 'name phone email')
      .sort({ createdAt: -1 });

    return successResponse(
      res,
      { ambulances, total: ambulances.length },
      'Admin fleet inventory loaded'
    );
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/v1/admin/analytics
// @access  Private (Admin only)
const getAnalytics = async (req, res, next) => {
  try {
    // Breakdown by emergency type
    const byEmergencyType = await AmbulanceRequest.aggregate([
      { $group: { _id: '$emergencyType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Breakdown by status
    const byStatus = await AmbulanceRequest.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Breakdown by ambulance type
    const byAmbulanceType = await Ambulance.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    // Average response time / distance for completed requests
    const completedAverages = await AmbulanceRequest.aggregate([
      { $match: { status: 'COMPLETED', distanceKm: { $ne: null } } },
      {
        $group: {
          _id: null,
          avgDistanceKm: { $avg: '$distanceKm' },
          avgEtaMinutes: { $avg: '$etaMinutes' },
          count: { $sum: 1 }
        }
      }
    ]);

    return successResponse(
      res,
      {
        byEmergencyType,
        byStatus,
        byAmbulanceType,
        averages: completedAverages[0] || { avgDistanceKm: 0, avgEtaMinutes: 0, count: 0 }
      },
      'Admin analytics data loaded'
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getAllRequestsAdmin,
  getAllAmbulancesAdmin,
  getAnalytics
};
