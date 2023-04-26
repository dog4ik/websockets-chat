import { useEffect } from "react";
import {
  Message,
  Read,
  Result,
  ServerMessage,
  useSocketContext,
} from "../SupportSocketContext";

const useConnection = (actions: {
  onRefresh?: () => void;
  onMessage?: (msg: Message) => void;
  onSendResult?: (res: Result) => void;
  onSeen?: (res: Read) => void;
}) => {
  const { socket } = useSocketContext();

  useEffect(() => {
    const handleMessage = (msg: MessageEvent<string>) => {
      console.log(msg.data);

      if (!msg.data) return;
      let parsed: ServerMessage = JSON.parse(msg.data);
      if (parsed.type === "Update") actions.onRefresh?.();
      if (parsed.type === "Message") actions.onMessage?.(parsed);
      if (parsed.type === "Result") actions.onSendResult?.(parsed);
      if (parsed.type === "Read") actions.onSeen?.(parsed);
    };
    socket?.addEventListener("message", handleMessage);
    return () => {
      socket?.removeEventListener("message", handleMessage);
    };
  }, [socket]);
  return socket?.send;
};
export default useConnection;
