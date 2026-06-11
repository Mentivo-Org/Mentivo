import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { verifyAccessToken } from '../utils/jwt.ts';

let io: Server;

export const initSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      // Mirror the same origins allowed in app.ts
      origin: (origin, callback) => {
        if (!origin) return callback(null, true); // mobile apps have no origin
        const allowed = [
          'https://mentivo.in',
          'https://www.mentivo.in',
          'http://localhost:3000',
          'http://localhost:3001',
        ];
        if (allowed.includes(origin) || origin.endsWith('.mentivo.in') || process.env.NODE_ENV !== 'production') {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
    // Render closes idle connections after ~55s.
    // pingInterval (25s) + pingTimeout (20s) = 45s total — safely within that window.
    pingInterval: 25000,
    pingTimeout: 20000,
    // Allow time for the initial handshake over a slow mobile connection.
    connectTimeout: 10000,
    // Allow both transports so mobile clients behind proxies can fall back to polling.
    transports: ['websocket', 'polling'],
  });

  // Authentication Middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = verifyAccessToken(token);
      socket.data.userId = decoded.userId;
      socket.data.role = decoded.role;
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId;
    console.log(`[Socket] User connected: ${userId} | Socket ID: ${socket.id}`);

    // Join a private room for this user
    socket.join(userId);

    socket.on('disconnect', (reason) => {
      console.log(`[Socket] User disconnected: ${userId} | Reason: ${reason}`);
      socket.leave(userId);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

/**
 * Send an event to a specific user's room
 */
export const emitToUser = (userId: string, event: string, data: any) => {
  if (io) {
    io.to(userId).emit(event, data);
  }
};
