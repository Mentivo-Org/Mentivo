import { io, Socket } from 'socket.io-client';
import { baseUrl } from '../constants/endpoint';

// Explicit socket URL — avoids fragile string manipulation on the REST base URL
const SOCKET_URL = baseUrl.replace('/api', '');

class SocketManager {
  private socket: Socket | null = null;
  private userId: string | null = null;
  private queuedListeners: { event: string, handler: (data: any) => void }[] = [];

  /**
   * Connect to the Socket.io server
   * @param token JWT Access Token
   * @param userId Current User ID
   */
  connect(token: string, userId: string) {
    if (this.socket?.connected && this.userId === userId) {
      console.log('[Socket] Already connected for user:', userId);
      return;
    }

    if (this.socket) {
      this.socket.disconnect();
    }

    this.userId = userId;
    this.socket = io(SOCKET_URL, {
      auth: { token },
      // Allow polling as a fallback — Render's proxy handles both.
      // socket.io will upgrade to websocket automatically once connected.
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: Infinity,
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Connected. Socket ID:', this.socket?.id);
    });

    this.socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected. Reason:', reason);
    });

    // Register queued listeners
    this.queuedListeners.forEach(({ event, handler }) => {
      this.socket?.on(event, handler);
    });
    this.queuedListeners = [];
  }

  /**
   * Register an event listener
   */
  on<T>(event: string, handler: (data: T) => void) {
    if (!this.socket) {
      console.warn('[Socket] Attempted to register listener before connecting. Queueing...');
      this.queuedListeners.push({ event, handler });
      return;
    }
    this.socket.on(event, handler);
  }

  /**
   * Remove an event listener
   */
  off<T>(event: string, handler: (data: T) => void) {
    if (!this.socket) {
       this.queuedListeners = this.queuedListeners.filter(l => l.event !== event || l.handler !== handler);
       return;
    }
    this.socket?.off(event, handler);
  }

  /**
   * Emit an event to the server
   */
  emit(event: string, data: any) {
    this.socket?.emit(event, data);
  }

  /**
   * Re-authenticate the socket with a fresh token.
   * Call this whenever the access token is silently refreshed.
   */
  reconnectWithNewToken(token: string) {
    if (this.socket) {
      console.log('[Socket] Re-authenticating with new token');
      this.socket.auth = { token };
      this.socket.disconnect().connect();
    }
  }

  /**
   * Disconnect the socket
   */
  disconnect() {
    if (this.socket) {
      console.log('[Socket] Manually disconnecting');
      this.socket.disconnect();
      this.socket = null;
      this.userId = null;
    }
  }

  /**
   * Check if socket is connected
   */
  isConnected() {
    return this.socket?.connected || false;
  }
}

export const socketManager = new SocketManager();
