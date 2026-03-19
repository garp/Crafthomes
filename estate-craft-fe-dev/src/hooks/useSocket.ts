import { useContext } from 'react';
import { SocketContext } from '../context/SocketContext';
import { socketService } from '../services/socket';
import type { TSocketContextValue } from '../types/socket.types';

/**
 * Hook to access socket context
 * @returns Socket context value with connection state and current user
 */
export const useSocket = (): TSocketContextValue => {
  const context = useContext(SocketContext);

  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }

  return context;
};

/**
 * Hook to get the raw socket instance
 * Use this when you need direct access to the socket for advanced use cases
 */
export const useSocketInstance = () => {
  const { isConnected } = useSocket();
  return {
    socket: socketService.getSocket(),
    isConnected,
  };
};
