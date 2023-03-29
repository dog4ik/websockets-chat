import { useEffect } from "react";
import { Message, useSocketContext } from "../ClientSocketContext";
import { ServerMessage } from "../SupportSocketContext";

const useConnection = (actions: {
  onRefresh?: () => void;
  onMessage?: (msg: Message) => void;
}) => {
  const { socket } = useSocketContext();

  useEffect(() => {
    const handleMessage = (msg: MessageEvent<string>) => {
      if (!msg.data) return;
      let parsed: ServerMessage = JSON.parse(msg.data);
      if (parsed.type === "Update") actions.onRefresh?.();
      if (parsed.type === "Message") actions.onMessage?.(parsed);
    };
    socket?.addEventListener("message", handleMessage);
    return () => {
      socket?.removeEventListener("message", handleMessage);
    };
  }, [socket]);
  return socket?.send;
};
export default useConnection;
