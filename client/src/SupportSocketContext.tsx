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
  send: (msg: string, room: string) => Promise<{ id: string }>;
  sendRead: (to: string, msg_id: string) => void;
};

export type MsgImg = {
  type: "Image";
  msg?: string;
  bytes: Uint8Array;
};

export type MsgText = {
  type: "Text";
  msg: string;
};

export type Message = {
  type: "Message";
  msg: MsgImg | MsgText;
  id: string;
  to: string;
  date: string;
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
  from: string;
  to: string;
  id: string;
};

export type ClientMessage =
  | { type: "Message"; to: string; from: string; message: string }
  | {
      type: "Image";
      to: string;
      from: string;
      bytes: Uint8Array;
      message?: string;
    }
  | {
      type: "Read";
      to: string;
      id: string;
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

  //TODO: local id to verify what message is delivered
  async function send(
    msg: string,
    to: string
  ): Promise<{
    id: string;
  }> {
    const message: ClientMessage = {
      type: "Message",
      message: msg,
      to,
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
    return promise;
  }
  async function sendRead(to: string, id: string) {
    const message: ClientMessage = {
      type: "Read",
      to,
      id,
    };
    sendMessage(JSON.stringify(message));
  }

  return (
    <SocketContext.Provider
      value={{
        isConnected,
        socket: webSocket,
        socketId,
        send,
        sendRead,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocketContext = () => useContext(SocketContext);
export default SocketProvider;
