const express = require('express');
const router = express.Router();
const ambulanceController = require('../controllers/ambulanceController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
  createAmbulanceValidator,
  updateStatusValidator,
  updateLocationValidator,
  listAmbulanceQueryValidator
} = require('../validators/ambulanceValidator');

// GET /api/v1/ambulances/available
router.get('/available', ambulanceController.getAvailableAmbulances);

// GET /api/v1/ambulances
router.get('/', validate(listAmbulanceQueryValidator), ambulanceController.getAllAmbulances);

// GET /api/v1/ambulances/:id
router.get('/:id', ambulanceController.getAmbulanceById);

// POST /api/v1/ambulances (Admin only)
router.post(
  '/',
  authenticate,
  authorize('admin'),
  validate(createAmbulanceValidator),
  ambulanceController.registerAmbulance
);

// PATCH /api/v1/ambulances/:id/status (Driver or Admin)
router.patch(
  '/:id/status',
  authenticate,
  authorize('driver', 'admin'),
  validate(updateStatusValidator),
  ambulanceController.updateAmbulanceStatus
);

// PATCH /api/v1/ambulances/:id/location (Driver or Admin)
router.patch(
  '/:id/location',
  authenticate,
  authorize('driver', 'admin'),
  validate(updateLocationValidator),
  ambulanceController.updateAmbulanceLocation
);

// POST /api/v1/ambulances/:id/simulate-move (Demo simulation endpoint)
router.post(
  '/:id/simulate-move',
  authenticate,
  authorize('driver', 'admin', 'patient'),
  ambulanceController.simulateMovement
);

module.exports = router;
