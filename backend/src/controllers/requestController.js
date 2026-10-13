const AmbulanceRequest = require('../models/AmbulanceRequest');
const Ambulance = require('../models/Ambulance');
const { assignNearestAmbulance, releaseAmbulance } = require('../services/assignmentService');
const { notifyRequestUpdated } = require('../services/socketService');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

// Allowed status transitions map
const VALID_TRANSITIONS = {
  REQUESTED: ['ACCEPTED', 'CANCELLED', 'REJECTED'],
  ACCEPTED: ['DISPATCHED', 'CANCELLED'],
  DISPATCHED: ['ARRIVING', 'CANCELLED'],
  ARRIVING: ['PATIENT_PICKED_UP', 'CANCELLED'],
  PATIENT_PICKED_UP: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
  REJECTED: ['REQUESTED']
};

// @route   POST /api/v1/requests
// @access  Private (Patient / Authenticated user)
const createRequest = async (req, res, next) => {
  try {
    const {
      pickup,
      destination,
      emergencyType,
      description,
      requestedAmbulanceType,
      patientContactNumber
    } = req.body;

    const patientId = req.user._id;
    const contact = patientContactNumber || req.user.phone;

    // Check if user already has an active, incomplete emergency request
    const existingActiveRequest = await AmbulanceRequest.findOne({
      patientId,
      status: { $in: ['REQUESTED', 'ACCEPTED', 'DISPATCHED', 'ARRIVING', 'PATIENT_PICKED_UP'] }
    });

    if (existingActiveRequest) {
      return errorResponse(
        res,
        'You already have an active emergency request in progress.',
        400,
        { existingRequestId: existingActiveRequest._id, status: existingActiveRequest.status }
      );
    }

    // Attempt automatic nearest ambulance assignment
    const assignment = await assignNearestAmbulance(
      pickup,
      requestedAmbulanceType || 'BLS'
    );

    const initialStatus = assignment.assignedAmbulance ? 'ACCEPTED' : 'REQUESTED';
    const statusNote = assignment.message;

    const newRequest = new AmbulanceRequest({
      patientId,
      patientContactNumber: contact,
      pickup: {
        address: pickup.address,
        latitude: Number(pickup.latitude),
        longitude: Number(pickup.longitude)
      },
      destination: destination
        ? {
            hospitalName: destination.hospitalName || 'City Emergency Care Center',
            address: destination.address || 'Central Medical District',
            latitude: destination.latitude ? Number(destination.latitude) : null,
            longitude: destination.longitude ? Number(destination.longitude) : null
          }
        : undefined,
      emergencyType,
      description: description || '',
      requestedAmbulanceType: requestedAmbulanceType || 'BLS',
      status: initialStatus,
      ambulanceId: assignment.assignedAmbulance ? assignment.assignedAmbulance._id : null,
      distanceKm: assignment.distanceKm,
      etaMinutes: assignment.etaMinutes,
      requestedAt: new Date(),
      assignedAt: assignment.assignedAmbulance ? new Date() : null,
      statusHistory: [
        {
          status: initialStatus,
          timestamp: new Date(),
          updatedBy: req.user._id,
          note: statusNote
        }
      ]
    });

    await newRequest.save();

    const populated = await AmbulanceRequest.findById(newRequest._id)
      .populate('patientId', 'name email phone emergencyContact')
      .populate({
        path: 'ambulanceId',
        populate: { path: 'driverId', select: 'name phone' }
      });

    // Notify connected clients via Socket.IO
    notifyRequestUpdated(populated);

    return successResponse(
      res,
      {
        request: populated,
        assignmentNotice: assignment.message,
        disclaimerNotice:
          'PROJECT PROTOTYPE NOTICE: This system is an educational software project. In life-threatening emergencies, always dial your local emergency hotline (911 / 112 / 108).'
      },
      'Emergency ambulance request submitted successfully',
      201
    );
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/v1/requests/my
// @access  Private (Patient)
const getMyRequests = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = { patientId: req.user._id };
    if (req.query.status) query.status = req.query.status;

    const total = await AmbulanceRequest.countDocuments(query);
    const requests = await AmbulanceRequest.find(query)
      .populate({
        path: 'ambulanceId',
        populate: { path: 'driverId', select: 'name phone' }
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
      'Requests retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/v1/requests/:id
// @access  Private (Patient owner, assigned driver, or admin)
const getRequestById = async (req, res, next) => {
  try {
    const request = await AmbulanceRequest.findById(req.params.id)
      .populate('patientId', 'name email phone emergencyContact')
      .populate({
        path: 'ambulanceId',
        populate: { path: 'driverId', select: 'name phone email' }
      })
      .populate('statusHistory.updatedBy', 'name role');

    if (!request) {
      return errorResponse(res, 'Ambulance request not found', 404);
    }

    // Role-based access validation
    const isPatientOwner = request.patientId._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    const isAssignedDriver =
      request.ambulanceId &&
      request.ambulanceId.driverId &&
      request.ambulanceId.driverId._id.toString() === req.user._id.toString();

    if (!isPatientOwner && !isAdmin && !isAssignedDriver) {
      return errorResponse(res, 'Access denied. You are not authorized to view this request.', 403);
    }

    return successResponse(res, { request }, 'Request details retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/v1/requests/:id/status
// @access  Private (Owner, Driver, Admin)
const getRequestStatus = async (req, res, next) => {
  try {
    const request = await AmbulanceRequest.findById(req.params.id)
      .populate({
        path: 'ambulanceId',
        populate: { path: 'driverId', select: 'name phone' }
      });

    if (!request) {
      return errorResponse(res, 'Ambulance request not found', 404);
    }

    return successResponse(
      res,
      {
        requestId: request._id,
        status: request.status,
        isCancellable: request.isCancellable(),
        ambulance: request.ambulanceId,
        pickup: request.pickup,
        destination: request.destination,
        distanceKm: request.distanceKm,
        etaMinutes: request.etaMinutes,
        requestedAt: request.requestedAt,
        assignedAt: request.assignedAt,
        statusHistory: request.statusHistory,
        lastLocationUpdate: request.ambulanceId ? request.ambulanceId.location.updatedAt : null
      },
      'Emergency status retrieved'
    );
  } catch (error) {
    next(error);
  }
};

// @route   PATCH /api/v1/requests/:id/status
// @access  Private (Driver or Admin)
const updateRequestStatus = async (req, res, next) => {
  try {
    const { status: nextStatus, note } = req.body;
    const request = await AmbulanceRequest.findById(req.params.id).populate('ambulanceId');

    if (!request) {
      return errorResponse(res, 'Ambulance request not found', 404);
    }

    // Validate role permissions
    const isAdmin = req.user.role === 'admin';
    const isAssignedDriver =
      request.ambulanceId &&
      request.ambulanceId.driverId &&
      request.ambulanceId.driverId.toString() === req.user._id.toString();

    if (!isAdmin && !isAssignedDriver) {
      return errorResponse(
        res,
        'Access denied. Only the assigned ambulance driver or dispatcher can update emergency status.',
        403
      );
    }

    // Validate status transition
    const currentStatus = request.status;
    const allowedNextStatuses = VALID_TRANSITIONS[currentStatus] || [];

    if (!allowedNextStatuses.includes(nextStatus)) {
      return errorResponse(
        res,
        `Invalid status transition from '${currentStatus}' to '${nextStatus}'. Allowed transitions: [${allowedNextStatuses.join(', ')}]`,
        400
      );
    }

    // Update timestamp fields
    if (nextStatus === 'PATIENT_PICKED_UP') {
      request.pickedUpAt = new Date();
    } else if (nextStatus === 'COMPLETED') {
      request.completedAt = new Date();
    }

    request.status = nextStatus;
    request.statusHistory.push({
      status: nextStatus,
      timestamp: new Date(),
      updatedBy: req.user._id,
      note: note || `Status updated to ${nextStatus}`
    });

    await request.save();

    // Side-effects on Ambulance resource
    if (request.ambulanceId) {
      if (nextStatus === 'DISPATCHED' || nextStatus === 'ARRIVING' || nextStatus === 'PATIENT_PICKED_UP') {
        await Ambulance.findByIdAndUpdate(request.ambulanceId._id, {
          status: 'On Trip',
          'location.updatedAt': new Date()
        });
      } else if (nextStatus === 'COMPLETED') {
        // Release ambulance back to Available
        await releaseAmbulance(request.ambulanceId._id);
        logger.info(`[Trip Complete] Ambulance ${request.ambulanceId.ambulanceNumber} released back to Available.`);
      } else if (nextStatus === 'REJECTED') {
        // Driver rejected; release ambulance and reset request for re-assignment
        await releaseAmbulance(request.ambulanceId._id);
        request.ambulanceId = null;
        request.status = 'REQUESTED';
        await request.save();
      }
    }

    const populated = await AmbulanceRequest.findById(request._id)
      .populate('patientId', 'name email phone emergencyContact')
      .populate({
        path: 'ambulanceId',
        populate: { path: 'driverId', select: 'name phone' }
      });

    notifyRequestUpdated(populated);

    return successResponse(res, { request: populated }, `Status updated to ${nextStatus}`);
  } catch (error) {
    next(error);
  }
};

// @route   PATCH /api/v1/requests/:id/cancel
// @access  Private (Patient owner or Admin)
const cancelRequest = async (req, res, next) => {
  try {
    const { cancellationReason } = req.body;
    const request = await AmbulanceRequest.findById(req.params.id).populate('ambulanceId');

    if (!request) {
      return errorResponse(res, 'Ambulance request not found', 404);
    }

    // Authorization: owner or admin
    const isOwner = request.patientId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return errorResponse(res, 'Access denied. You can only cancel your own emergency request.', 403);
    }

    // Check cancellation eligibility
    if (!request.isCancellable()) {
      return errorResponse(
        res,
        `Cannot cancel request in status '${request.status}'. Requests cannot be cancelled once the patient is picked up or completed.`,
        400
      );
    }

    request.status = 'CANCELLED';
    request.cancellationReason = cancellationReason || 'Cancelled by patient';
    request.cancelledAt = new Date();
    request.statusHistory.push({
      status: 'CANCELLED',
      timestamp: new Date(),
      updatedBy: req.user._id,
      note: `Cancelled. Reason: ${cancellationReason}`
    });

    await request.save();

    // Release assigned ambulance back to fleet
    if (request.ambulanceId) {
      await releaseAmbulance(request.ambulanceId._id);
      logger.info(`[Request Cancelled] Released ambulance ${request.ambulanceId.ambulanceNumber}`);
    }

    const populated = await AmbulanceRequest.findById(request._id)
      .populate('patientId', 'name email phone emergencyContact')
      .populate({
        path: 'ambulanceId',
        populate: { path: 'driverId', select: 'name phone' }
      });

    notifyRequestUpdated(populated);

    return successResponse(
      res,
      { request: populated },
      'Ambulance request has been successfully cancelled'
    );
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/v1/requests/:id/location
// @access  Private (Patient, Driver, Admin)
const getRequestLocation = async (req, res, next) => {
  try {
    const request = await AmbulanceRequest.findById(req.params.id).populate('ambulanceId');

    if (!request) {
      return errorResponse(res, 'Ambulance request not found', 404);
    }

    if (!request.ambulanceId) {
      return errorResponse(res, 'No ambulance has been assigned to this request yet.', 404);
    }

    return successResponse(
      res,
      {
        ambulanceId: request.ambulanceId._id,
        ambulanceNumber: request.ambulanceId.ambulanceNumber,
        status: request.ambulanceId.status,
        location: request.ambulanceId.location,
        lastUpdate: request.ambulanceId.location.updatedAt,
        pickup: request.pickup,
        destination: request.destination
      },
      'Assigned ambulance location retrieved'
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRequest,
  getMyRequests,
  getRequestById,
  getRequestStatus,
  updateRequestStatus,
  cancelRequest,
  getRequestLocation
};
