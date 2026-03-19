import type { TNotification } from './notification.types';

// User data received from user:me socket event
export type TSocketUser = {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  userType: 'INTERNAL' | 'EXTERNAL';
  status: 'ACTIVE' | 'INACTIVE';
  role: {
    id: string;
    name: string;
  };
};

// Server -> Client events
export interface ServerToClientEvents {
  // User events
  'user:me': (user: TSocketUser) => void;

  // Notification events
  'notification:new': (notification: TNotification) => void;
  'notification:count': (data: { unreadCount: number }) => void;

  // Connection events
  connect: () => void;
  disconnect: (reason: string) => void;
  connect_error: (error: Error) => void;
}

// Client -> Server events
export interface ClientToServerEvents {
  // Request user data
  me: () => void;

  // Notification events
  'notification:markRead': (
    notificationId: string,
    callback?: (res: { success: boolean; error?: string }) => void,
  ) => void;
  'notification:markAllRead': (
    callback?: (res: { success: boolean; error?: string }) => void,
  ) => void;
}

// Socket connection status
export type TSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

// Socket context type
export type TSocketContextValue = {
  isConnected: boolean;
  status: TSocketStatus;
  currentUser: TSocketUser | null;
  connect: () => void;
  disconnect: () => void;
};
