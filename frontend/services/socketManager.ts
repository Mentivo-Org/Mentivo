import { io, Socket } from 'socket.io-client';
import { baseUrl } from '../constants/endpoint';

// Derive socket URL from baseUrl (e.g., http://ip:3000/api -> http://ip:3000)
const socketUrl = baseUrl.replace('/api', '');

class SocketManager {
  private socket: Socket | null = null;
  private userId: string | null = null;

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
    this.socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket'], // Force websocket for reliability in RN
      reconnection: true,
      reconnectionDelay: 1000,
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
  }

  /**
   * Register an event listener
   */
  on<T>(event: string, handler: (data: T) => void) {
    if (!this.socket) {
      console.warn('[Socket] Attempted to register listener before connecting');
      return;
    }
    this.socket.on(event, handler);
  }

  /**
   * Remove an event listener
   */
  off<T>(event: string, handler: (data: T) => void) {
    this.socket?.off(event, handler);
  }

  /**
   * Emit an event to the server
   */
  emit(event: string, data: any) {
    this.socket?.emit(event, data);
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
