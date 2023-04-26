import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import useWebSocket from "./hooks/useWebSocket";
import { ServerMessage } from "./SupportSocketContext";

type ContextType = {
  isConnected: boolean;
  socket: WebSocket | null;
  supportId?: string;
  socketId?: string;
  send: (msg: string) => Promise<{ id: string }>;
  sendRead: (to: string, msg_id: string) => void;
};

type Image = {
  type: "Image";
  message?: string;
  bytes: number[];
  to: string;
};

type Message = {
  type: "Message";
  message: string;
  to: string;
};

type Switch = {
  type: "Switch";
  id: string;
};

type Open = {
  type: "Open";
  id: string;
  daddy: string;
};
type Read = {
  type: "Read";
  id: string;
  to: string;
};

export type ClientMessage = Message | Image | Open | Switch | Read;

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

  async function sendRead(to: string, id: string) {
    const message: ClientMessage = {
      type: "Read",
      to,
      id,
    };
    sendMessage(JSON.stringify(message));
  }
  async function send(msg: string): Promise<{
    id: string;
  }> {
    if (!supportId) throw Error("Nobody send to");
    const message: ClientMessage = {
      type: "Message",
      message: msg,
      to: supportId,
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
        //TODO: verify message here
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

  return (
    <SocketContext.Provider
      value={{
        isConnected,
        socket: webSocket,
        socketId,
        send,
        supportId,
        sendRead,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocketContext = () => useContext(SocketContext);
export default SocketProvider;
