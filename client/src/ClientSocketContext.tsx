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
  from: string;
};

export type Update = {
  type: "Update";
};

export type Disconnect = {
  type: "Disconnect";
};

export type Switch = {
  type: "Switch";
  id: string;
};

export type Open = {
  type: "Open";
  id: string;
  daddy: string;
};

export type ClientMessage = Message | Image | Open | Switch;

export const SocketContext = createContext<ContextType>({} as ContextType);
const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [socketId, setSocketId] = useState<string>();
  const [supportId, setSupportId] = useState<string>();
  const { webSocket, sendMessage, isConnected } = useWebSocket(
    `${import.meta.env.VITE_WS_SERVER_URL}`
  );

  //register
  useEffect(() => {
    const handleOpen = (msg: MessageEvent) => {
      let data: ClientMessage = JSON.parse(msg.data);
      if (data.type === "Open") {
        console.log(data);
        setSocketId(data.id);
        setSupportId(data.daddy);
      }
      if (data.type === "Switch") {
        setSupportId(data.id);
      }
    };
    webSocket?.addEventListener("message", handleOpen);
    return () => webSocket?.removeEventListener("message", handleOpen);
  }, [webSocket]);

  function send(msg: string) {
    if (!supportId) return;
    const message: ClientMessage = {
      type: "Message",
      message: msg,
      room: supportId,
      from: socketId!,
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
