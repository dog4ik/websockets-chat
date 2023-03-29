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
  supportId?: string;
  socketId?: string;
  send: (msg: string) => void;
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

export const SocketContext = createContext<ContextType>({} as ContextType);
const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [socketId, setSocketId] = useState<string>();
  const [supportId, setSupportId] = useState<string>();
  const { webSocket, sendMessage, isConnected } = useWebSocket(
    socketId
      ? `${import.meta.env.VITE_WS_SERVER_URL}?id=${socketId}`
      : undefined
  );

  //register
  useEffect(() => {
    const register = async () => {
      if (!socketId) {
        let id = await axios.get<{ id: string; support_id: string }>(
          import.meta.env.VITE_SERVER_URL + "/register"
        );
        setSocketId(id.data.id);
        setSupportId(id.data.support_id);
      }
    };
    register();
  }, []);

  function send(msg: string) {
    if (!supportId) return;
    const message: ClientMessage = {
      type: "Message",
      message: msg,
      room: supportId,
    };
    sendMessage(JSON.stringify(message));
  }

  return (
    <SocketContext.Provider
      value={{ isConnected, socket: webSocket, socketId, send, supportId }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocketContext = () => useContext(SocketContext);
export default SocketProvider;
