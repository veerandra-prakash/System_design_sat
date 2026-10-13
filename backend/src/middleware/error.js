const logger = require('../utils/logger');
const { errorResponse } = require('../utils/response');

// Centralized Error Handling Middleware
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  logger.error(`[Error Middleware] ${err.name || 'Error'}: ${err.message}`, {
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method
  });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((el) => ({
      field: el.path,
      message: el.message
    }));
    return errorResponse(res, 'Validation error occurred', 400, errors);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const fields = Object.keys(err.keyValue || {});
    return errorResponse(
      res,
      `Duplicate field value: ${fields.join(', ')}. Please use unique values.`,
      409
    );
  }

  // Mongoose invalid ObjectId
  if (err.name === 'CastError') {
    return errorResponse(res, `Invalid format for field '${err.path}': ${err.value}`, 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return errorResponse(res, 'Invalid authentication token provided.', 401);
  }
  if (err.name === 'TokenExpiredError') {
    return errorResponse(res, 'Authentication token has expired.', 401);
  }

  // Default response
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  return errorResponse(
    res,
    process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'An unexpected error occurred. Please try again later.'
      : message,
    statusCode
  );
};

// 404 Route Not Found handler
const notFoundHandler = (req, res) => {
  return errorResponse(
    res,
    `Route not found: [${req.method}] ${req.originalUrl}`,
    404
  );
};

module.exports = {
  errorHandler,
  notFoundHandler
};
