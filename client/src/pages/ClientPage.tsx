import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { FaArrowUp, FaSync } from "react-icons/fa";
import { useSocketContext } from "../ClientSocketContext";
import { v4 } from "uuid";
import { ChatMessageType } from "../store";
import useConnection from "../hooks/useClientConnection";

type MessageProps = {
  text: string;
  isMine: boolean;
};
const MessageBubble = ({ text, isMine }: MessageProps) => {
  return (
    <div
      className={`p-2 mb-2 h-fit max-w-[150px] w-fit font-semibold rounded-2xl
    ${isMine ? "bg-sky-500 self-end" : "bg-black"}`}
    >
      <p className="break-words">{text}</p>
    </div>
  );
};
const ClientPage = () => {
  const { socketId, send, isConnected, supportId } = useSocketContext();
  const msgContainerRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  useConnection({
    onMessage(msg) {
      setMessages((prev) => [
        ...prev,
        { text: msg.message, isMine: false, date: new Date() },
      ]);
    },
  });
  const handleSent = () => {
    if (message.trim() === "") return;
    send(message);
    setMessages((prev) => [
      ...prev,
      { text: message, isMine: true, date: new Date() },
    ]);
    setMessage("");
  };
  useEffect(() => {
    msgContainerRef.current?.scrollTo(0, msgContainerRef.current.scrollHeight);
  }, [messages]);
  return (
    <div className="flex justify-center h-full items-center">
      <div
        ref={msgContainerRef}
        className="h-96 w-64 bg-neutral-700 overflow-y-auto rounded-lg flex flex-col"
      >
        <div>myId: {socketId}</div>
        <div>supportId: {supportId}</div>
        <div className="flex-1 px-2 flex flex-col justify-end gap-4">
          {messages.map((msg) => (
            <MessageBubble key={v4()} text={msg.text} isMine={msg.isMine} />
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSent();
          }}
          className="flex rounded-lg sticky bottom-0"
        >
          <input
            className="bg-neutral-800 w-full px-1 rounded-lg outline-none"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
            }}
          />
          <button
            className="p-1 rounded-full bg-black"
            onClick={(e) => {
              if (!isConnected) {
                e.preventDefault();
              }
            }}
          >
            {isConnected ? <FaArrowUp size={30} /> : <FaSync size={30} />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ClientPage;
