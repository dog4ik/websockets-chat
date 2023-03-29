import { useEffect, useState } from "react";

function useWebSocket(url?: string) {
  const [webSocket, setWebSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const sendMessage = (msg: any) => {
    if (!webSocket) return;
    webSocket.send(msg);
  };

  // const reconnect = () => {
  //   if (!webSocket) return;
  //   setWebSocket(new WebSocket(url));
  //   setIsConnected(webSocket?.readyState === 1);
  // };
  //handle reconnect
  // useEffect(() => {
  //   let timeout: ReturnType<typeof setTimeout>;
  //   const retry = () => {
  //     if (!isConncted) {
  //       timeout = setTimeout(() => {
  //         console.log("retrying");
  //         reconnect();
  //         retry();
  //       }, 1000);
  //     }
  //   };
  //   if (!isConncted) retry();
  //   return () => {
  //     clearTimeout(timeout);
  //   };
  // }, [isConncted]);

  useEffect(() => {
    if (!url) return;
    const newWebSocket = new WebSocket(url);
    setWebSocket(newWebSocket);
    const handleOpen = () => {
      setIsConnected(true);
    };
    const handleClose = () => {
      setIsConnected(false);
    };
    const handleError = () => {
      console.log("WS Error");
      setIsConnected(false);
    };
    newWebSocket.addEventListener("open", handleOpen);
    newWebSocket.addEventListener("close", handleClose);
    newWebSocket.addEventListener("error", handleError);
    return () => {
      newWebSocket.removeEventListener("open", handleOpen);
      newWebSocket.removeEventListener("close", handleClose);
      newWebSocket.removeEventListener("error", handleError);
      newWebSocket.close();
    };
  }, [url]);

  return {
    webSocket,
    isConnected,
    sendMessage,
  };
}

export default useWebSocket;
