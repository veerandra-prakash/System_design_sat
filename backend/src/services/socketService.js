let ioInstance = null;

const initSocket = (io) => {
  ioInstance = io;
};

const getIO = () => {
  return ioInstance;
};

/**
 * Emit event to a specific room (e.g., `request:<requestId>`, `ambulance:<ambulanceId>`, `role:admin`)
 */
const emitToRoom = (room, event, data) => {
  if (ioInstance) {
    ioInstance.to(room).emit(event, data);
  }
};

/**
 * Broadcast emergency request updates to the patient's room, driver, and admin dashboard
 */
const notifyRequestUpdated = (request) => {
  if (!ioInstance) return;

  const payload = {
    requestId: request._id,
    status: request.status,
    ambulanceId: request.ambulanceId ? (request.ambulanceId._id || request.ambulanceId) : null,
    request
  };

  // Notify specific request room (patient and driver listening to this request)
  ioInstance.to(`request:${request._id}`).emit('request_updated', payload);

  // Notify admin dashboard
  ioInstance.to('room:admin').emit('admin_request_updated', payload);

  // If assigned to an ambulance, notify ambulance room
  if (request.ambulanceId) {
    const ambId = request.ambulanceId._id || request.ambulanceId;
    ioInstance.to(`ambulance:${ambId}`).emit('trip_updated', payload);
  }
};

/**
 * Broadcast ambulance GPS location update
 */
const notifyAmbulanceLocation = (ambulanceId, locationData) => {
  if (!ioInstance) return;
  const payload = {
    ambulanceId,
    location: locationData,
    timestamp: new Date().toISOString()
  };
  // To ambulance room
  ioInstance.to(`ambulance:${ambulanceId}`).emit('ambulance_location_updated', payload);
  // To general fleet tracking
  ioInstance.to('room:admin').emit('fleet_location_updated', payload);
  // Also broadcast globally or to tracking rooms
  ioInstance.emit(`location:${ambulanceId}`, payload);
};

/**
 * Broadcast ambulance status update
 */
const notifyAmbulanceStatus = (ambulanceId, status, details = {}) => {
  if (!ioInstance) return;
  const payload = {
    ambulanceId,
    status,
    details,
    timestamp: new Date().toISOString()
  };
  ioInstance.to(`ambulance:${ambulanceId}`).emit('ambulance_status_updated', payload);
  ioInstance.to('room:admin').emit('fleet_status_updated', payload);
};

module.exports = {
  initSocket,
  getIO,
  emitToRoom,
  notifyRequestUpdated,
  notifyAmbulanceLocation,
  notifyAmbulanceStatus
};
