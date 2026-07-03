import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    let instance = null;
    if (user) {
      instance = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000');
      instance.emit('user_online', user._id);
      setSocket(instance);
    } else {
      setSocket(null);
    }
    return () => {
      if (instance) instance.disconnect();
    };
  }, [user?._id]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
