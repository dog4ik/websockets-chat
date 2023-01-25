import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { io, Socket } from "socket.io-client";
type ContextType = {
  isConnected: boolean;
  socket: Socket;
  socketId?: string;
};
const socket = io(import.meta.env.VITE_SERVER_URL, { path: "/socket" });
export const SocketContext = createContext<ContextType>({
  socket,
  isConnected: false,
  socketId: undefined,
});
const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [socketId, setSocketId] = useState(socket.id);

  useEffect(() => {
    socket.on("connect", () => {
      console.log(socket.id);
      setIsConnected(true);
      setSocketId(socket.id);
    });
    socket.on("disconnect", () => {
      setIsConnected(false);
    });
    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("pong");
    };
  }, []);
  return (
    <SocketContext.Provider value={{ isConnected, socket, socketId }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocketContext = () => useContext(SocketContext);
export default SocketProvider;
