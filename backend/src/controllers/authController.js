const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/response');

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name
    },
    process.env.JWT_SECRET || 'super_secret_jwt_key_ambulance_connect_2026_secure',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    }
  );
};

// @route   POST /api/v1/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, phone, password, role, emergencyContact } = req.body;

    // Check existing email
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return errorResponse(res, 'An account with this email address already exists.', 409);
    }

    // Hash password
    const passwordHash = await User.hashPassword(password);

    // Default role is patient. Allow driver/admin if specified in body (or in seed/admin register)
    const assignedRole = role && ['patient', 'driver', 'admin'].includes(role) ? role : 'patient';

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      phone,
      passwordHash,
      role: assignedRole,
      emergencyContact: emergencyContact || { name: '', phone: '', relationship: '' }
    });

    const token = generateToken(user);

    return successResponse(
      res,
      {
        user: user.toJSON(),
        token
      },
      'Registration successful',
      201
    );
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/v1/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return errorResponse(res, 'Invalid email or password.', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return errorResponse(res, 'Invalid email or password.', 401);
    }

    const token = generateToken(user);

    return successResponse(
      res,
      {
        user: user.toJSON(),
        token
      },
      'Login successful',
      200
    );
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/v1/auth/me
// @access  Private (Authenticated)
const getMe = async (req, res) => {
  return successResponse(res, { user: req.user.toJSON() }, 'User profile retrieved');
};

// @route   PATCH /api/v1/auth/me
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, emergencyContact } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (emergencyContact) {
      user.emergencyContact = {
        name: emergencyContact.name !== undefined ? emergencyContact.name : user.emergencyContact.name,
        phone: emergencyContact.phone !== undefined ? emergencyContact.phone : user.emergencyContact.phone,
        relationship: emergencyContact.relationship !== undefined ? emergencyContact.relationship : user.emergencyContact.relationship
      };
    }

    await user.save();

    return successResponse(res, { user: user.toJSON() }, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile
};
