import axios from "axios";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import useWebSocket from "./hooks/useWebSocket";

type StatusType = "CONNECTING" | "OPEN" | "CLOSED" | "CLOSING";

type ContextType = {
  isConnected: boolean;
  socket: WebSocket | null;
  socketId?: string;
  send: (msg: string, room: string) => void;
};

export type Image = {
  type: "Message";
  message: string;
  bytes: number[];
  room: string;
};

export type Message = {
  type: "Message";
  message: string;
  room: string;
};

export type Update = {
  type: "Update";
};

export type Disconnect = {
  type: "Disconnect";
};

export type ClientMessage = Message | Image;

export type ServerMessage = Message | Image | Update | Disconnect;

export const SocketContext = createContext<ContextType>({} as ContextType);
const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [socketId, setSocketId] = useState<string>();
  const { webSocket, sendMessage, isConnected } = useWebSocket(
    socketId
      ? `${import.meta.env.VITE_WS_SERVER_URL}?id=${socketId}`
      : undefined
  );
  //register
  useEffect(() => {
    const register = async () => {
      if (!socketId) {
        let id = await axios.get(import.meta.env.VITE_SERVER_URL + "/begod");
        setSocketId(id.data);
      }
    };
    register();
  }, []);

  function send(msg: string, room: string) {
    const message: ClientMessage = {
      type: "Message",
      message: msg,
      room: room,
    };
    sendMessage(JSON.stringify(message));
  }

  return (
    <SocketContext.Provider
      value={{ isConnected, socket: webSocket, socketId, send }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocketContext = () => useContext(SocketContext);
export default SocketProvider;
