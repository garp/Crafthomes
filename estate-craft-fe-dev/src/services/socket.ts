import { io, Socket } from 'socket.io-client';
import { getToken } from '../utils/auth';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  TSocketStatus,
} from '../types/socket.types';

// Typed socket instance
type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const SOCKET_URL = import.meta.env.VITE_SOCKET_BASE_URL || 'http://localhost:5005';

// Socket configuration
const SOCKET_CONFIG = {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  transports: ['polling', 'websocket'] as ('polling' | 'websocket')[],
};

class SocketService {
  private socket: TypedSocket | null = null;
  private static instance: SocketService;
  private status: TSocketStatus = 'disconnected';
  private statusListeners: Set<(status: TSocketStatus) => void> = new Set();

  private constructor() {}

  /**
   * Get singleton instance of SocketService
   */
  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  /**
   * Update connection status and notify listeners
   */
  private setStatus(newStatus: TSocketStatus): void {
    this.status = newStatus;
    this.statusListeners.forEach((listener) => listener(newStatus));
  }

  /**
   * Subscribe to status changes
   */
  onStatusChange(listener: (status: TSocketStatus) => void): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  /**
   * Get current connection status
   */
  getStatus(): TSocketStatus {
    return this.status;
  }

  /**
   * Connect to socket server with token as query parameter
   */
  connect(): TypedSocket {
    // Return existing socket if already connected
    if (this.socket?.connected) {
      return this.socket;
    }

    // Disconnect existing socket if present but not connected
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
    }

    this.setStatus('connecting');

    // Create socket connection with token as query parameter
    this.socket = io(SOCKET_URL, {
      ...SOCKET_CONFIG,
      query: {
        token: getToken() || '',
      },
    }) as TypedSocket;

    // Setup connection event handlers
    this.setupEventHandlers();

    return this.socket;
  }

  /**
   * Setup socket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[Socket] Connected successfully:', this.socket?.id);
      this.setStatus('connected');

      // Emit user:me to request user data from server
      this.emit('me');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      this.setStatus('disconnected');

      if (reason === 'io server disconnect') {
        console.warn('[Socket] Server forced disconnect - may need to re-authenticate');
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error.message);
      this.setStatus('error');
    });

    // Handle reconnection attempts
    this.socket.io.on('reconnect_attempt', (attemptNumber) => {
      console.log('[Socket] Reconnection attempt:', attemptNumber);
      this.setStatus('connecting');

      // Update token on reconnection in case it was refreshed
      const newToken = getToken();
      if (newToken && this.socket) {
        (this.socket.io.opts.query as Record<string, string>).token = newToken;
      }
    });

    this.socket.io.on('reconnect', (attemptNumber) => {
      console.log('[Socket] Reconnected after', attemptNumber, 'attempts');
      this.setStatus('connected');
    });

    this.socket.io.on('reconnect_failed', () => {
      console.error('[Socket] Failed to reconnect after all attempts');
      this.setStatus('error');
    });
  }

  /**
   * Disconnect from socket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.setStatus('disconnected');
      console.log('[Socket] Manually disconnected');
    }
  }

  /**
   * Get the socket instance
   */
  getSocket(): TypedSocket | null {
    return this.socket;
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Emit an event to the server
   */
  emit<K extends keyof ClientToServerEvents>(
    event: K,
    ...args: Parameters<ClientToServerEvents[K]>
  ): void {
    if (!this.socket) {
      console.warn('[Socket] Cannot emit event - socket not initialized:', event);
      return;
    }
    console.log('[Socket] Emitting event:', event);
    this.socket.emit(event, ...args);
  }

  /**
   * Subscribe to a server event
   */
  on<K extends keyof ServerToClientEvents>(event: K, callback: ServerToClientEvents[K]): void {
    if (!this.socket) {
      console.warn('[Socket] Cannot subscribe to event - socket not initialized:', event);
      return;
    }
    this.socket.on(event, callback as any);
  }

  /**
   * Unsubscribe from a server event
   */
  off<K extends keyof ServerToClientEvents>(event: K, callback?: ServerToClientEvents[K]): void {
    if (!this.socket) return;
    if (callback) {
      this.socket.off(event, callback as any);
    } else {
      this.socket.off(event);
    }
  }

  /**
   * Reconnect with a new token (useful after login or token refresh)
   */
  reconnectWithNewToken(): void {
    this.disconnect();
    this.connect();
  }
}

// Export singleton instance
export const socketService = SocketService.getInstance();

// Export class for testing purposes
export { SocketService };
