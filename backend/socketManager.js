const jwt = require('jsonwebtoken');
const logger = require('./config/logger');

let io;
// Map user IDs to their socket IDs to emit private events
const userSocketMap = new Map();

const initSocket = (server) => {
  const socketIo = require('socket.io');

  // Use same allowed origins as REST API
  const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map((o) => o.trim())
    : ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:5173'];

  io = socketIo(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Authentication Middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers['authorization'];
    if (!token) {
      return next(new Error('Authentication Error: Token missing'));
    }

    if (!process.env.JWT_SECRET) {
      logger.error('JWT_SECRET environment variable is not set');
      return next(new Error('Server configuration error'));
    }

    try {
      // Remove 'Bearer ' if present
      const cleanToken = token.replace(/^Bearer\s+/i, '');
      const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      logger.warn('Socket authentication failed:', { message: err.message });
      return next(new Error('Authentication Error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    logger.debug(`Socket connected for user: ${socket.userId}`);

    // Store user session
    userSocketMap.set(socket.userId, socket.id);

    socket.on('disconnect', () => {
      logger.debug(`Socket disconnected for user: ${socket.userId}`);
      userSocketMap.delete(socket.userId);
    });
  });

  return io;
};

const sendNotificationToUser = (userId, notificationData) => {
  if (!io) {
    logger.warn('Socket.io is not initialized yet');
    return;
  }

  const socketId = userSocketMap.get(userId.toString());
  if (socketId) {
    io.to(socketId).emit('new_notification', notificationData);
  }
};

module.exports = {
  initSocket,
  sendNotificationToUser,
};
