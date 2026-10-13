const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Ambulance = require('../models/Ambulance');
const logger = require('../utils/logger');
const { notifyAmbulanceLocation } = require('../services/socketService');

/**
 * Socket.IO Authentication & Room Management Handler
 */
const registerSocketHandlers = (io) => {
  // Authentication middleware for socket connections (optional token in handshake)
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (token) {
        try {
          const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || 'super_secret_jwt_key_ambulance_connect_2026_secure'
          );
          const user = await User.findById(decoded.id);
          if (user) {
            socket.user = user;
          }
        } catch {
          // Allow connection even if token fails, but without authenticated socket.user
        }
      }
      return next();
    } catch {
      return next();
    }
  });

  io.on('connection', (socket) => {
    const userRole = socket.user?.role || 'guest';
    const userName = socket.user?.name || 'Anonymous';
    logger.info(`[Socket Connected] ID: ${socket.id} (${userName}, Role: ${userRole})`);

    // Join admin room if user is admin
    if (socket.user && socket.user.role === 'admin') {
      socket.join('room:admin');
      logger.info(`[Socket Room] Admin ${socket.user.name} joined 'room:admin'`);
    }

    // Client requests to join a specific request tracking room
    socket.on('join_request', (requestId) => {
      if (requestId) {
        socket.join(`request:${requestId}`);
        logger.debug(`[Socket Room] ${socket.id} joined request:${requestId}`);
        socket.emit('joined_room', { room: `request:${requestId}`, status: 'ok' });
      }
    });

    // Client leaves request room
    socket.on('leave_request', (requestId) => {
      if (requestId) {
        socket.leave(`request:${requestId}`);
        logger.debug(`[Socket Room] ${socket.id} left request:${requestId}`);
      }
    });

    // Ambulance driver joins their ambulance room
    socket.on('join_ambulance', (ambulanceId) => {
      if (ambulanceId) {
        socket.join(`ambulance:${ambulanceId}`);
        logger.debug(`[Socket Room] ${socket.id} joined ambulance:${ambulanceId}`);
      }
    });

    // Real-time location stream from Driver
    socket.on('driver_location_update', async (data) => {
      try {
        const { ambulanceId, latitude, longitude, address } = data;
        if (!ambulanceId || latitude === undefined || longitude === undefined) return;

        // Persist latest location to DB
        await Ambulance.findByIdAndUpdate(ambulanceId, {
          'location.latitude': Number(latitude),
          'location.longitude': Number(longitude),
          'location.address': address || 'En Route (Live GPS)',
          'location.updatedAt': new Date()
        });

        // Broadcast to tracking room
        notifyAmbulanceLocation(ambulanceId, {
          latitude: Number(latitude),
          longitude: Number(longitude),
          address: address || 'En Route (Live GPS)',
          updatedAt: new Date()
        });
      } catch (err) {
        logger.error(`[Socket Location Error] ${err.message}`);
      }
    });

    socket.on('disconnect', () => {
      logger.info(`[Socket Disconnected] ID: ${socket.id}`);
    });
  });
};

module.exports = registerSocketHandlers;
