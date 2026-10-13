const Ambulance = require('../models/Ambulance');
const { successResponse, errorResponse } = require('../utils/response');
const { notifyAmbulanceLocation, notifyAmbulanceStatus } = require('../services/socketService');

// @route   POST /api/v1/ambulances
// @access  Private (Admin only)
const registerAmbulance = async (req, res, next) => {
  try {
    const {
      ambulanceNumber,
      registrationNumber,
      type,
      driverId,
      location,
      equipment,
      status,
      isOnline
    } = req.body;

    const existingAmbulance = await Ambulance.findOne({
      $or: [
        { ambulanceNumber: ambulanceNumber.toUpperCase() },
        { registrationNumber: registrationNumber.toUpperCase() }
      ]
    });

    if (existingAmbulance) {
      return errorResponse(
        res,
        'An ambulance with this Ambulance Number or Registration Number already exists.',
        409
      );
    }

    const ambulance = await Ambulance.create({
      ambulanceNumber: ambulanceNumber.toUpperCase(),
      registrationNumber: registrationNumber.toUpperCase(),
      type,
      driverId: driverId || null,
      status: status || 'Available',
      isOnline: isOnline !== undefined ? isOnline : true,
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address || 'Station Depot',
        updatedAt: new Date()
      },
      equipment: equipment || ['Oxygen Cylinder', 'Stretcher', 'First Aid Kit']
    });

    const populated = await ambulance.populate('driverId', 'name phone email');

    return successResponse(res, { ambulance: populated }, 'Ambulance registered successfully', 201);
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/v1/ambulances
// @access  Public / Authenticated
const getAllAmbulances = async (req, res, next) => {
  try {
    const { type, status, isOnline, search } = req.query;
    const query = {};

    if (type) query.type = type;
    if (status) query.status = status;
    if (isOnline !== undefined) query.isOnline = isOnline === 'true';
    if (search) {
      query.$or = [
        { ambulanceNumber: { $regex: search, $options: 'i' } },
        { registrationNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const ambulances = await Ambulance.find(query)
      .populate('driverId', 'name phone')
      .sort({ createdAt: -1 });

    return successResponse(res, { ambulances, total: ambulances.length }, 'Ambulances fetched successfully');
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/v1/ambulances/available
// @access  Public / Authenticated
const getAvailableAmbulances = async (req, res, next) => {
  try {
    const { type } = req.query;
    const query = { status: 'Available', isOnline: true };
    if (type) query.type = type;

    const ambulances = await Ambulance.find(query)
      .populate('driverId', 'name phone')
      .sort({ updatedAt: -1 });

    return successResponse(
      res,
      { ambulances, total: ambulances.length },
      'Available ambulances retrieved'
    );
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/v1/ambulances/:id
// @access  Public / Authenticated
const getAmbulanceById = async (req, res, next) => {
  try {
    const ambulance = await Ambulance.findById(req.params.id).populate('driverId', 'name phone email');
    if (!ambulance) {
      return errorResponse(res, 'Ambulance not found', 404);
    }

    return successResponse(res, { ambulance }, 'Ambulance details retrieved');
  } catch (error) {
    next(error);
  }
};

// @route   PATCH /api/v1/ambulances/:id/status
// @access  Private (Driver or Admin)
const updateAmbulanceStatus = async (req, res, next) => {
  try {
    const { status, isOnline } = req.body;
    const ambulance = await Ambulance.findById(req.params.id);

    if (!ambulance) {
      return errorResponse(res, 'Ambulance not found', 404);
    }

    // Role check: driver can only update their own assigned ambulance
    if (req.user.role === 'driver') {
      if (!ambulance.driverId || ambulance.driverId.toString() !== req.user._id.toString()) {
        return errorResponse(res, 'Access denied. You can only update your assigned ambulance.', 403);
      }
    }

    if (status) ambulance.status = status;
    if (isOnline !== undefined) ambulance.isOnline = Boolean(isOnline);
    ambulance.location.updatedAt = new Date();

    await ambulance.save();
    const populated = await ambulance.populate('driverId', 'name phone email');

    // Socket notification
    notifyAmbulanceStatus(ambulance._id, ambulance.status, { isOnline: ambulance.isOnline });

    return successResponse(res, { ambulance: populated }, 'Ambulance status updated successfully');
  } catch (error) {
    next(error);
  }
};

// @route   PATCH /api/v1/ambulances/:id/location
// @access  Private (Driver or Admin)
const updateAmbulanceLocation = async (req, res, next) => {
  try {
    const { latitude, longitude, address } = req.body;
    const ambulance = await Ambulance.findById(req.params.id);

    if (!ambulance) {
      return errorResponse(res, 'Ambulance not found', 404);
    }

    // Driver can only update their assigned ambulance
    if (req.user.role === 'driver') {
      if (!ambulance.driverId || ambulance.driverId.toString() !== req.user._id.toString()) {
        return errorResponse(res, 'Access denied. You can only update your assigned ambulance location.', 403);
      }
    }

    ambulance.location = {
      latitude: Number(latitude),
      longitude: Number(longitude),
      address: address || ambulance.location.address || 'En Route',
      updatedAt: new Date()
    };

    await ambulance.save();

    // Broadcast live location over Socket.io
    notifyAmbulanceLocation(ambulance._id, ambulance.location);

    return successResponse(
      res,
      {
        ambulanceId: ambulance._id,
        location: ambulance.location
      },
      'Ambulance location updated'
    );
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/v1/ambulances/:id/simulate-move
// @access  Private (Driver or Admin or Demo/Testing)
const simulateMovement = async (req, res, next) => {
  try {
    const { targetLat, targetLng, stepFraction = 0.15 } = req.body;
    const ambulance = await Ambulance.findById(req.params.id);

    if (!ambulance) {
      return errorResponse(res, 'Ambulance not found', 404);
    }

    const currentLat = ambulance.location.latitude;
    const currentLng = ambulance.location.longitude;

    // Interpolate towards target coordinates
    const newLat = currentLat + (targetLat - currentLat) * stepFraction;
    const newLng = currentLng + (targetLng - currentLng) * stepFraction;

    ambulance.location = {
      latitude: Math.round(newLat * 1000000) / 1000000,
      longitude: Math.round(newLng * 1000000) / 1000000,
      address: `Simulated GPS en route (${ambulance.status})`,
      updatedAt: new Date()
    };

    await ambulance.save();

    notifyAmbulanceLocation(ambulance._id, {
      ...ambulance.location.toObject(),
      isSimulatedDemo: true
    });

    return successResponse(
      res,
      {
        ambulanceId: ambulance._id,
        location: ambulance.location,
        isSimulatedDemo: true,
        notice: 'DEMO MODE: Coordinates simulated for testing Leaflet visualization.'
      },
      'Simulated movement step updated'
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerAmbulance,
  getAllAmbulances,
  getAvailableAmbulances,
  getAmbulanceById,
  updateAmbulanceStatus,
  updateAmbulanceLocation,
  simulateMovement
};
