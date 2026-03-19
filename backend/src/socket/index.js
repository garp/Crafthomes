import { Server } from 'socket.io';
import { CORS } from '../../config/server.js';
import { socketAuthMiddleware } from './auth.socket.js';
import { registerHandlers } from './handlers/index.js';
import { initNotificationEmitter } from './emitters/notification.emitter.js';
import { logInfo, logError } from '../utils/logger.js';

let io = null;

export const initializeSocket = httpServer => {
  io = new Server(httpServer, {
    cors: {
      origin: CORS.ORIGIN,
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication middleware
  io.use(socketAuthMiddleware);

  // Connection handler
  io.on('connection', socket => {
    logInfo(`Socket connected: ${socket.id} (user: ${socket.user.id})`);
    registerHandlers(io, socket);
  });

  // Initialize emitter with io instance
  initNotificationEmitter(io);

  logInfo('Socket.IO initialized');
  return io;
};

/**
 * Get Socket.IO instance
 */
export const getIO = () => io;

/**
 * Graceful shutdown
 */
export const closeSocket = () => {
  return new Promise(resolve => {
    if (io) {
      io.close(() => {
        logInfo('Socket.IO closed');
        resolve();
      });
    } else {
      resolve();
    }
  });
};

