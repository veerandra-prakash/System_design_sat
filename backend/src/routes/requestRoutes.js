const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
  createRequestValidator,
  updateRequestStatusValidator,
  cancelRequestValidator,
  listRequestsQueryValidator
} = require('../validators/requestValidator');

// POST /api/v1/requests (Authenticated patients)
router.post(
  '/',
  authenticate,
  validate(createRequestValidator),
  requestController.createRequest
);

// GET /api/v1/requests/my (Authenticated patient requests list)
router.get(
  '/my',
  authenticate,
  validate(listRequestsQueryValidator),
  requestController.getMyRequests
);

// GET /api/v1/requests/:id (Owner, Driver, Admin)
router.get(
  '/:id',
  authenticate,
  requestController.getRequestById
);

// GET /api/v1/requests/:id/status (Owner, Driver, Admin)
router.get(
  '/:id/status',
  authenticate,
  requestController.getRequestStatus
);

// PATCH /api/v1/requests/:id/status (Driver or Admin only)
router.patch(
  '/:id/status',
  authenticate,
  authorize('driver', 'admin'),
  validate(updateRequestStatusValidator),
  requestController.updateRequestStatus
);

// PATCH /api/v1/requests/:id/cancel (Owner or Admin)
router.patch(
  '/:id/cancel',
  authenticate,
  validate(cancelRequestValidator),
  requestController.cancelRequest
);

// GET /api/v1/requests/:id/location (Assigned ambulance's last known location)
router.get(
  '/:id/location',
  authenticate,
  requestController.getRequestLocation
);

module.exports = router;
