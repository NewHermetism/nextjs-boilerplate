import { SOCKET_API_URL } from 'config';
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState
} from 'react';
import { io, Socket } from 'socket.io-client';
import { logout } from 'helpers';

const callbackUrl = `${window.location.origin}/`;
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

  useEffect(() => {
    // Initialize socket connection
    socket.current = io(SOCKET_API_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
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
      logout(callbackUrl, onRedirect, shouldAttemptReLogin, options);
    });

    // Cleanup on unmount
    return () => {
      if (socket.current) {
        socket.current.off('connect');
        socket.current.off('disconnect');
        socket.current.off('error');
        socket.current.off('connect_error');
        socket.current.disconnect();
      }
    };
  }, []);

  const getProfile = (accessToken: string): Promise<any> => {
    return new Promise<boolean>((resolve, reject) => {
      if (!socket.current) {
        reject(new Error('Socket not connected'));
        return;
      }
      socket.current.emit('getProfile', {
        accessToken
      });

      socket.current.once('getProfile', (data: { profile: any }) => {
        resolve(data.profile);
      });

      socket.current.once('getProfileError', (error) => {
        reject(error);
      });
    });
  };

  return (
    <SocketContext.Provider
      value={{ socket: socket.current, getProfile, isConnected }}
    >
      {children}
    </SocketContext.Provider>
  );
};
