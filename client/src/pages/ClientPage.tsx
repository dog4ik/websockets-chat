import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { FaArrowUp } from "react-icons/fa";
import { useSocketContext } from "../SocketContext";
import { v4 } from "uuid";

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
      className={`p-2 mb-2 h-fit max-w-[150px] w-fit font-semibold rounded-2xl
    ${isMine ? "bg-sky-500 self-end" : "bg-black"}`}
    >
      <p className="break-words">{text}</p>
    </div>
  );
};
const ClientPage = () => {
  const { socket, socketId } = useSocketContext();
  const msgContainerRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState("");
  const [godId, setGodId] = useState("");
  const [messages, setMessages] = useState<MessageType[]>([]);
  const getGod = async () => {
    const { data } = await axios.get(
      import.meta.env.VITE_SERVER_URL + "/getgod"
    );
    console.log(data);

    setGodId(data.godId);
  };
  const handleSent = () => {
    if (message.trim() === "") return;
    socket.emit("send", message, godId);
    setMessages((prev) => [
      ...prev,
      { text: message, isMine: true, date: new Date() },
    ]);
    setMessage("");
  };
  useEffect(() => {
    getGod();
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
        <div>{socketId}</div>
        <div>godId {godId}</div>
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
          <button className="p-1 rounded-full bg-black">
            <FaArrowUp size={30} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ClientPage;
