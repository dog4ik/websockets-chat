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

export type Result = {
  type: "Result";
  id: string;
};

export type Read = {
  type: "Read";
  user: string;
  msg_id: string;
};

export type ClientMessage =
  | { type: "Message"; to: string; from: string; message: string }
  | {
      type: "Image";
      to: string;
      from: string;
      bytes: Uint8Array;
      message?: string;
    };

export type ServerMessage =
  | Message
  | Update
  | Disconnect
  | Open
  | Result
  | Read;

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
    let promise = new Promise<{ id: string }>((resolve, reject) => {
      if (!webSocket) {
        reject("no connection established");
        return;
      }
      let timeout = setTimeout(() => {
        reject("timeout");
        return;
      }, 1_000);
      const handleResult = (msg: MessageEvent) => {
        const parsed: ServerMessage = JSON.parse(msg.data);
        if (parsed.type === "Result") {
          webSocket.removeEventListener("message", handleResult);
          clearTimeout(timeout);
          resolve({ id: parsed.id });
        }
      };
      webSocket.addEventListener("message", handleResult);
    });
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
