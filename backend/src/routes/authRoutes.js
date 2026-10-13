const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');
const {
  registerValidator,
  loginValidator,
  updateProfileValidator
} = require('../validators/authValidator');

// POST /api/v1/auth/register
router.post('/register', authLimiter, validate(registerValidator), authController.register);

// POST /api/v1/auth/login
router.post('/login', authLimiter, validate(loginValidator), authController.login);

// GET /api/v1/auth/me
router.get('/me', authenticate, authController.getMe);

// PATCH /api/v1/auth/me
router.patch('/me', authenticate, validate(updateProfileValidator), authController.updateProfile);

module.exports = router;
