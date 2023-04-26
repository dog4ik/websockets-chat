import { useEffect } from "react";
import { useSocketContext } from "../ClientSocketContext";
import { Message, Read, ServerMessage } from "../SupportSocketContext";

const useConnection = (actions: {
  onRefresh?: () => void;
  onMessage?: (msg: Message) => void;
  onSeen?: (msg: Read) => void;
}) => {
  const { socket } = useSocketContext();

  useEffect(() => {
    const handleMessage = (msg: MessageEvent<string>) => {
      console.log(msg.data);
      if (!msg.data) return;
      let parsed: ServerMessage = JSON.parse(msg.data);
      if (parsed.type === "Update") actions.onRefresh?.();
      if (parsed.type === "Message") actions.onMessage?.(parsed);
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
