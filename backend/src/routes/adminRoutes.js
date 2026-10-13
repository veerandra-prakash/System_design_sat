const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

// All admin routes require admin authentication and role
router.use(authenticate, authorize('admin'));

// GET /api/v1/admin/dashboard
router.get('/dashboard', adminController.getDashboardStats);

// GET /api/v1/admin/requests
router.get('/requests', adminController.getAllRequestsAdmin);

// GET /api/v1/admin/ambulances
router.get('/ambulances', adminController.getAllAmbulancesAdmin);

// GET /api/v1/admin/analytics
router.get('/analytics', adminController.getAnalytics);

module.exports = router;
