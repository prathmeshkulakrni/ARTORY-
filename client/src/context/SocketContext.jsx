import { createContext, useContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);

  useEffect(() => {
    if (user) {
      socketRef.current = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', { transports: ['websocket'] });
      socketRef.current.emit('user_online', user._id);
    }
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
