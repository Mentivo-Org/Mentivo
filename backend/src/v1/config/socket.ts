import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { verifyAccessToken } from '../utils/jwt.ts';

let io: Server;

export const initSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      // Mirror the same origins allowed in app.ts.
      // React Native sends no Origin header, so !origin must be allowed.
      origin: (origin, callback) => {
        if (!origin) return callback(null, true); // mobile apps have no origin
        const allowed = [
          'https://mentivo.in',
          'https://www.mentivo.in',
          'http://localhost:3000',
          'http://localhost:3001',
        ];
        if (
          allowed.includes(origin) ||
          origin.endsWith('.mentivo.in') ||
          process.env.NODE_ENV !== 'production'
        ) {
          callback(null, true);
        } else {
          console.warn(`[Socket] CORS rejected origin: "${origin}"`);
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
    // Allow both transports so mobile clients can start with polling and upgrade.
    transports: [ 'polling', 'websocket'],
  });

  io.sockets.setMaxListeners(0);
  io.engine.setMaxListeners(0);

  const tag = '[Socket.io]';

  // ── Engine-level diagnostics (fires before auth, for every transport attempt) ──
  io.engine.on('connection', (rawSocket: any) => {
    console.log(
      `${tag} New engine connection | transport: ${rawSocket.transport.name} | remoteAddress: ${rawSocket.remoteAddress}`
    );

    rawSocket.on('upgrade', () => {
      console.log(`${tag} Transport upgraded to: ${rawSocket.transport.name}`);
    });

    rawSocket.on('close', (reason: string) => {
      console.log(`${tag} Engine socket closed | reason: ${reason}`);
    });
  });

  io.engine.on('connect_error', (err: any) => {
    console.error(
      `${tag} Engine connection_error | code: ${err.code} | message: ${err.message} | context: ${JSON.stringify(err.context ?? {})}`
    );
  });
  // ── Engine-level errors (CORS failures, handshake errors show here) ──
  io.engine.on('connection_error', (err: any) => {
    console.error(
      `${tag} Engine connection_error | code: ${err.code} | message: ${err.message} | context: ${JSON.stringify(err.context ?? {})}`
    );
  });

  // ── Authentication Middleware ──
  io.use((socket, next) => {
    const { address, headers, auth } = socket.handshake;
    const transport = socket.conn.transport.name;
    const origin = headers.origin ?? '(no origin — mobile client)';

    console.log(
      `${tag} Handshake received | transport: ${transport} | origin: "${origin}" | remoteAddress: ${address}`
    );

    const token =
      auth.token || headers.authorization?.split(' ')[1];

    if (!token) {
      console.error(`${tag} Auth failed — no token provided | origin: "${origin}"`);
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = verifyAccessToken(token as string);
      socket.data.userId = decoded.userId;
      socket.data.role = decoded.role;
      console.log(
        `${tag} Auth passed | userId: ${decoded.userId} | role: ${decoded.role} | transport: ${transport}`
      );
      next();
    } catch (err: any) {
      console.error(
        `${tag} Auth failed — invalid/expired token | reason: ${err.message} | origin: "${origin}"`
      );
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  // ── Successful socket connections ──
  io.on('connection', (socket) => {
    const { userId, role } = socket.data;
    const transport = socket.conn.transport.name;
    console.log(
      `${tag} Connected | userId: ${userId} | role: ${role} | transport: ${transport} | socketId: ${socket.id}`
    );

    socket.join(userId);

    socket.conn.on('upgrade', () => {
      console.log(
        `${tag} Upgraded | userId: ${userId} | transport: ${socket.conn.transport.name}`
      );
    });

    socket.on('disconnect', (reason) => {
      console.log(
        `${tag} Disconnected | userId: ${userId} | socketId: ${socket.id} | reason: ${reason}`
      );
      socket.leave(userId);
    });

    socket.on('error', (err) => {
      console.error(`${tag} Socket error | userId: ${userId} | error: ${err.message}`);
    });
  });

  console.log(`${tag} Initialized | pingInterval: 25s | pingTimeout: 20s | transports: [websocket, polling]`);

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
    console.log("Socket event emitted to ", userId);
  }
};
