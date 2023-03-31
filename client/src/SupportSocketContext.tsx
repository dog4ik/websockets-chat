import axios from "axios";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import useWebSocket from "./hooks/useWebSocket";

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
  from: string;
};

export type Update = {
  type: "Update";
};

export type Disconnect = {
  type: "Disconnect";
};

export type Open = {
  type: "Open";
  id: string;
};

export type ClientMessage = Message | Image;

export type ServerMessage = Message | Image | Update | Disconnect | Open;

export const SocketContext = createContext<ContextType>({} as ContextType);
const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [socketId, setSocketId] = useState<string>();
  const { webSocket, sendMessage, isConnected } = useWebSocket(
    `${import.meta.env.VITE_WS_SERVER_URL}?is_support=true`
  );
  //register
  useEffect(() => {
    const handleOpen = (msg: MessageEvent) => {
      let data: ServerMessage = JSON.parse(msg.data);
      if (data.type === "Open") {
        setSocketId(data.id);
      }
    };
    webSocket?.addEventListener("message", handleOpen);
    return () => webSocket?.removeEventListener("message", handleOpen);
  }, [webSocket]);

  function send(msg: string, room: string) {
    const message: ClientMessage = {
      type: "Message",
      message: msg,
      room: room,
      from: socketId ?? "",
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
