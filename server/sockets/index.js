import { Server } from 'socket.io';
import { setIO } from '../services/realtime.js';

/**
 * Initialize Socket.IO on top of the HTTP server and register it with the
 * realtime service so controllers/services can emit events.
 */
export const initSockets = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`🔌 client connected: ${socket.id} (total ${io.engine.clientsCount})`);
    socket.emit('connected', { id: socket.id });

    socket.on('disconnect', () => {
      console.log(`🔌 client disconnected: ${socket.id}`);
    });
  });

  setIO(io);
  return io;
};

export default initSockets;
