const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/authRoutes');
const ambulanceRoutes = require('./routes/ambulanceRoutes');
const requestRoutes = require('./routes/requestRoutes');
const adminRoutes = require('./routes/adminRoutes');
const healthRoutes = require('./routes/healthRoutes');

const { errorHandler, notFoundHandler } = require('./middleware/error');
const { apiLimiter } = require('./middleware/rateLimiter');
const setupSwagger = require('./config/swagger');

const app = express();

// Secure HTTP headers
app.use(
  helmet({
    contentSecurityPolicy: false // Allows Swagger UI to load its styles & scripts
  })
);

// Cross-Origin Resource Sharing
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173'
];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps, curl, postman)
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      return callback(new Error('Blocked by CORS policy'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Swagger OpenAPI documentation
setupSwagger(app);

// Base health check
app.use('/api/v1/health', healthRoutes);

// Apply rate limiter to API routes
app.use('/api/v1/', apiLimiter);

// Resource routes under /api/v1
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/ambulances', ambulanceRoutes);
app.use('/api/v1/requests', requestRoutes);
app.use('/api/v1/admin', adminRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to AmbulanceConnect REST API Gateway',
    version: '1.0.0',
    docs: '/api-docs',
    health: '/api/v1/health'
  });
});

// 404 Handler
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

module.exports = app;
