import { useEffect, useRef, useState } from "react";
import { FaArrowUp } from "react-icons/fa";
import { useSocketContext } from "../SocketContext";

type MessageProps = {
  text: string;
  isMine: boolean;
};
type MessageType = {
  text: string;
  isMine: boolean;
  date: Date;
};
const MessageBubble = ({ text, isMine }: MessageProps) => {
  return (
    <div
      className={`p-2 h-fit max-w-[150px] w-fit font-semibold rounded-2xl
    ${isMine ? "bg-sky-500 self-end" : "bg-black"}`}
    >
      <p className="break-words">{text}</p>
    </div>
  );
};
const ClientPage = () => {
  const { socket } = useSocketContext();
  const msgContainerRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<MessageType[]>([]);
  const handleSent = () => {
    if (message.trim() === "") return;
    socket.emit("send", message);
    setMessages((prev) => [
      ...prev,
      { text: message, isMine: true, date: new Date() },
    ]);
    setMessage("");
  };
  useEffect(() => {
    socket.on("receive", (msg: string) => {
      console.log(msg);
      setMessages((prev) => [
        ...prev,
        { text: msg, isMine: false, date: new Date() },
      ]);
    });
    return () => {
      socket.off("receive");
    };
  }, []);
  useEffect(() => {
    msgContainerRef.current?.scrollTo(0, msgContainerRef.current.scrollHeight);
  }, [messages]);
  return (
    <div className="flex justify-center h-full items-center">
      <div
        ref={msgContainerRef}
        className="h-96 w-64 bg-neutral-700 overflow-y-auto rounded-lg flex flex-col"
      >
        <div className="flex-1 px-2 flex flex-col justify-end gap-4">
          {messages.map((msg) => (
            <MessageBubble text={msg.text} isMine={msg.isMine} />
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
            className="bg-neutral-800 rounded-lg outline-none"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
            }}
          />
          <button className="p-1 rounded-full bg-black">
            <FaArrowUp size={30} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ClientPage;
