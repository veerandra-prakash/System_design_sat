require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');

const app = require('./app');
const connectDB = require('./config/db');
const { initSocket } = require('./services/socketService');
const registerSocketHandlers = require('./sockets/socketHandler');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

// Create HTTP Server
const server = http.createServer(app);

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: [
      process.env.CLIENT_URL || 'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173'
    ],
    methods: ['GET', 'POST', 'PATCH'],
    credentials: true
  }
});

// Initialize socket service & handlers
initSocket(io);
registerSocketHandlers(io);

// Start Server and Database Connection
const startServer = async () => {
  try {
    await connectDB();

    server.listen(PORT, () => {
      logger.info(`=======================================================`);
      logger.info(`🚨 AmbulanceConnect Backend Server is LIVE on port ${PORT}`);
      logger.info(`📚 Swagger OpenAPI Documentation: http://localhost:${PORT}/api-docs`);
      logger.info(`❤️  Health Check API:             http://localhost:${PORT}/api/v1/health`);
      logger.info(`⚡ Socket.IO Ready on:           http://localhost:${PORT}`);
      logger.info(`=======================================================`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  logger.info(`[Shutdown] Received ${signal}. Closing server gracefully...`);
  server.close(() => {
    logger.info('[Shutdown] HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = { app, server };
