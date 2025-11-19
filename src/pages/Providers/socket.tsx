import { SOCKET_API_URL, socketTimeout } from 'config';
import { RouteNamesEnum } from 'localConstants';
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback
} from 'react';
import { io, Socket } from 'socket.io-client';
import { logout } from 'helpers';

const resolveCallbackUrl = () =>
  typeof window !== 'undefined'
    ? `${window.location.origin}${RouteNamesEnum.unlock}`
    : RouteNamesEnum.unlock;
const onRedirect = undefined; // use this to redirect with useNavigate to a specific page after logout
const shouldAttemptReLogin = false; // use for special cases where you want to re-login after logout
const options = {
  shouldBroadcastLogoutAcrossTabs: true,
  hasConsentPopup: false
};

// Define the context type
interface SocketContextType {
  isConnected: boolean;
  socket: Socket | null;
  getProfile(accessToken: string): Promise<any>;
}

// Create the context
const SocketContext = createContext<SocketContextType>({
  isConnected: false,
  socket: null,
  getProfile: async () => ({})
});

// Export a hook for easy access
export const useSocket = () => useContext(SocketContext);

// Provider component
export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const socket = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const callbackUrlRef = useRef(resolveCallbackUrl());

  useEffect(() => {
    // Initialize socket connection
    socket.current = io(SOCKET_API_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      secure: SOCKET_API_URL.startsWith('https')
    });

    // Handle connection events
    socket.current.on('connect', () => {
      console.log('Connected to server');
      console.log('Socket ID:', socket.current?.id);
      setIsConnected(true);
    });

    socket.current.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    socket.current.on('error', (error) => {
      console.error('Socket error:', error);
    });

    socket.current.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setIsConnected(false);
    });

    socket.current.on('unauthorized', () => {
      logout(
        callbackUrlRef.current,
        onRedirect,
        shouldAttemptReLogin,
        options
      );
    });

    // Cleanup on unmount
    return () => {
      if (socket.current) {
        socket.current.off('connect');
        socket.current.off('disconnect');
        socket.current.off('error');
        socket.current.off('connect_error');
        socket.current.off('unauthorized');
        socket.current.disconnect();
      }
    };
  }, []);

  const getProfile = useCallback((accessToken: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      const socketInstance = socket.current;

      if (!socketInstance) {
        reject(new Error('Socket not connected'));
        return;
      }

      let timeoutId: ReturnType<typeof setTimeout> | undefined;

      const successEvent = 'getVDashProfile';
      const errorEvent = 'getVDashProfileError';

      const cleanup = () => {
        socketInstance.off(successEvent, handleSuccess);
        socketInstance.off(errorEvent, handleError);
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      };

      const handleSuccess = (data: { profile?: any } | any) => {
        cleanup();
        if (data && typeof data === 'object' && 'profile' in data) {
          resolve((data as { profile: any }).profile);
        } else {
          resolve(data);
        }
      };

      const handleError = (error: unknown) => {
        cleanup();
        reject(
          error instanceof Error
            ? error
            : new Error('Unable to retrieve profile information')
        );
      };

      socketInstance.on(successEvent, handleSuccess);
      socketInstance.on(errorEvent, handleError);

      timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error('Profile request timed out'));
      }, socketTimeout);

      socketInstance.emit('getVDashProfile', {
        accessToken
      });
    });
  }, []);

  return (
    <SocketContext.Provider
      value={{ socket: socket.current, getProfile, isConnected }}
    >
      {children}
    </SocketContext.Provider>
  );
};
