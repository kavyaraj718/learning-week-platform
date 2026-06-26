import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || undefined; // undefined → same origin (proxied)

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    return () => socket.disconnect();
  }, []);

  return (
    <SocketContext.Provider value={{ socket: socketRef, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);

/**
 * Subscribe to one or more server events and run a callback (debounced) when
 * any of them fire. Used by pages to live-refresh their data.
 */
export const useLiveRefresh = (events, callback, deps = []) => {
  const { socket } = useSocket() || {};
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    const s = socket?.current;
    if (!s) return;
    let timer = null;
    const handler = (payload) => {
      clearTimeout(timer);
      timer = setTimeout(() => cbRef.current(payload), 250);
    };
    const list = Array.isArray(events) ? events : [events];
    list.forEach((e) => s.on(e, handler));
    return () => {
      clearTimeout(timer);
      list.forEach((e) => s.off(e, handler));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, ...deps]);
};
