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
};
const socket = io("http://localhost:5000", { path: "/socket" });
export const SocketContext = createContext<ContextType>({
  socket,
  isConnected: false,
});
const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [isConnected, setIsConnected] = useState(socket.connected);
  useEffect(() => {
    socket.on("connect", () => {
      console.log(socket.id);
      setIsConnected(true);
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
    <SocketContext.Provider value={{ isConnected, socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocketContext = () => useContext(SocketContext);
export default SocketProvider;
