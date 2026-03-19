import { useEffect, useRef } from 'react';
import { socketService } from '../services/socket';
import { useSocket } from './useSocket';
import type { ServerToClientEvents } from '../types/socket.types';

/**
 * Hook to subscribe to a socket event
 *
 * @param event - The event name to listen for
 * @param handler - Callback function to handle the event
 * @param deps - Optional dependency array for the handler
 *
 * @example
 * ```tsx
 * useSocketEvent('user:me', (user) => {
 *   console.log('User data received:', user);
 * }, []);
 * ```
 */
export function useSocketEvent<K extends keyof ServerToClientEvents>(
  event: K,
  handler: ServerToClientEvents[K],
  deps: React.DependencyList = [],
): void {
  const { isConnected } = useSocket();
  const savedHandler = useRef(handler);

  // Update ref when handler changes
  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!isConnected) return;

    // Create a stable wrapper that calls the current handler
    const eventHandler = ((...args: any[]) => {
      (savedHandler.current as any)(...args);
    }) as ServerToClientEvents[K];

    socketService.on(event, eventHandler);

    return () => {
      socketService.off(event, eventHandler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, isConnected, ...deps]);
}
