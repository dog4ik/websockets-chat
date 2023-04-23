import { useEffect, useRef, useState } from "react";
import { FaArrowUp, FaSpinner, FaSync } from "react-icons/fa";
import { useSocketContext } from "../ClientSocketContext";
import { v4 } from "uuid";
import { ChatMessageType } from "../store";
import useConnection from "../hooks/useClientConnection";

type MessageProps = {
  text: string;
  isMine: boolean;
};
const Loading = () => {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="animate-spin">
        <FaSpinner size={45} />
      </div>
    </div>
  );
};
const MessageBubble = ({ text, isMine }: MessageProps) => {
  return (
    <div
      className={`mb-2 h-fit w-fit max-w-[150px] rounded-2xl p-2 font-semibold
    ${isMine ? "self-end bg-sky-500" : "bg-black"}`}
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
      console.log(msg);
      switch (msg.msg.type) {
        case "Text": {
          const text = msg.msg.msg;
          setMessages((prev) => [
            ...prev,
            {
              text,
              id: msg.id,
              isMine: false,
              date: new Date().toString(),
              isReaded: false,
            },
          ]);
          break;
        }
        case "Image":
          break;
      }
    },
  });
  const handleSent = async () => {
    if (message.trim() === "") return;
    let { id } = await send(message);
    setMessages((prev) => [
      ...prev,
      {
        text: message,
        id,
        isMine: true,
        date: new Date().toString(),
        isReaded: true,
      },
    ]);
    setMessage("");
  };
  useEffect(() => {
    msgContainerRef.current?.scrollTo(0, msgContainerRef.current.scrollHeight);
  }, [messages]);
  if (!supportId) return <Loading />;
  return (
    <div>
      <div>myId: {socketId}</div>
      <div>supportId: {supportId}</div>
      <div className="flex h-full items-center justify-center">
        <div
          ref={msgContainerRef}
          className="flex h-96 w-64 flex-col overflow-y-auto rounded-lg bg-neutral-700"
        >
          <div className="flex flex-1 flex-col justify-end gap-4 px-2">
            {messages.map((msg) => (
              <MessageBubble key={v4()} text={msg.text} isMine={msg.isMine} />
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSent();
            }}
            className="sticky bottom-0 flex rounded-lg"
          >
            <input
              className="w-full rounded-lg bg-neutral-800 px-1 outline-none"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
              }}
            />
            <button
              className="rounded-full bg-black p-1"
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
    </div>
  );
};

export default ClientPage;
