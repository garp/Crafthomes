import { createContext, useEffect, useState, useCallback, useMemo, type ReactNode } from 'react';
import { socketService } from '../services/socket';
import { isAuthenticated } from '../utils/auth';
import type { TSocketStatus, TSocketContextValue, TSocketUser } from '../types/socket.types';

// Default context value
const defaultContextValue: TSocketContextValue = {
  isConnected: false,
  status: 'disconnected',
  currentUser: null,
  connect: () => {},
  disconnect: () => {},
};

// Create context
const SocketContext = createContext<TSocketContextValue>(defaultContextValue);

// Provider props
type SocketProviderProps = {
  children: ReactNode;
  /**
   * Auto-connect when user is authenticated
   * @default true
   */
  autoConnect?: boolean;
};

/**
 * Socket Provider Component
 * Manages socket connection lifecycle and provides socket context to children
 */
export const SocketProvider = ({ children, autoConnect = true }: SocketProviderProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState<TSocketStatus>('disconnected');
  const [currentUser, setCurrentUser] = useState<TSocketUser | null>(null);

  /**
   * Connect to socket server
   */
  const connect = useCallback(() => {
    if (!isAuthenticated()) {
      console.warn('[SocketProvider] Cannot connect - user not authenticated');
      return;
    }

    socketService.connect();
  }, []);

  /**
   * Disconnect from socket server
   */
  const disconnect = useCallback(() => {
    socketService.disconnect();
    setCurrentUser(null);
  }, []);

  // Setup connection and status listeners
  useEffect(() => {
    // Subscribe to status changes
    const unsubscribe = socketService.onStatusChange((newStatus) => {
      setStatus(newStatus);
      setIsConnected(newStatus === 'connected');
    });

    // Auto-connect if enabled and user is authenticated
    if (autoConnect && isAuthenticated()) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      unsubscribe();
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  // Listen for user:me event when connected
  useEffect(() => {
    if (!isConnected) return;

    const handleUserMe = (user: TSocketUser) => {
      console.log('[SocketProvider] Received user:me:', user);
      setCurrentUser(user);
    };

    socketService.on('user:me', handleUserMe);

    return () => {
      socketService.off('user:me', handleUserMe);
    };
  }, [isConnected]);

  // Listen for auth changes (login/logout)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'accessToken') {
        if (e.newValue) {
          // Token added - user logged in
          if (autoConnect) {
            setTimeout(() => {
              socketService.reconnectWithNewToken();
            }, 100);
          }
        } else {
          // Token removed - user logged out
          disconnect();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [autoConnect, disconnect]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<TSocketContextValue>(
    () => ({
      isConnected,
      status,
      currentUser,
      connect,
      disconnect,
    }),
    [isConnected, status, currentUser, connect, disconnect],
  );

  return <SocketContext.Provider value={contextValue}>{children}</SocketContext.Provider>;
};

// Export context for use in hooks
export { SocketContext };
