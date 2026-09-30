import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false });

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const socketTarget = import.meta.env.VITE_SOCKET_URL ||
      import.meta.env.VITE_SERVER_URL ||
      (import.meta.env.DEV ? 'http://localhost:5000' : window.location.origin);

    const socketInstance = io(socketTarget, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 5
    });

    socketInstance.on('connect', () => {
      console.log('⚡ [Realtime WebSocket] Connected to server! Socket ID:', socketInstance.id);
      setIsConnected(true);
      socketInstance.emit('join', user.id);
    });

    socketInstance.on('disconnect', () => {
      console.log('⚡ [Realtime WebSocket] Disconnected from server');
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
