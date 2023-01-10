import { useEffect, useRef, useState } from "react";
import { FaArrowUp } from "react-icons/fa";
import { useLoaderData } from "react-router-dom";
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
      className={`p-2 max-w-xs md:max-w-lg h-fit w-fit text-xl font-semibold rounded-2xl
    ${isMine ? "bg-sky-500 self-end" : "bg-neutral-600"}`}
    >
      <p className="break-words">{text}</p>
    </div>
  );
};
const Chat = () => {
  const { socket } = useSocketContext();
  const data = useLoaderData() as string;
  const [curMessage, setCurMessage] = useState("");
  const msgContainerRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const handleSend = () => {
    if (curMessage.trim() === "") return;
    socket.emit("send", curMessage);
    setMessages((prev) => [
      ...prev,
      { text: curMessage, isMine: true, date: new Date() },
    ]);
    setCurMessage("");
  };
  useEffect(() => {
    msgContainerRef.current?.scrollTo(0, msgContainerRef.current.scrollHeight);
  }, [messages]);
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

  return (
    <div
      ref={msgContainerRef}
      className="w-full flex h-screen overflow-y-scroll flex-col"
    >
      <div className="flex gap-3 bg-neutral-800 sticky top-0 left-0 right-0 p-2 h-20">
        <div className="h-16 rounded-full bg-orange-500 aspect-square" />
        <div className="flex flex-col justify-between py-2">
          <span className="text-2xl">{data}</span>
          <div className="flex items-center gap-2">
            <span>Status:</span>
            <div
              className={`h-2 rounded-full ${"bg-green-500"} aspect-square`}
            />
          </div>
        </div>
      </div>
      <div className="flex-1 shrink-0 bg-neutral-900 flex justify-end flex-col ">
        <div className="flex-col flex gap-4 px-10">
          {messages.map((msg) => (
            <MessageBubble isMine={msg.isMine} text={msg.text} />
          ))}
        </div>
        <form
          className="h-16 flex sticky bottom-0 px-5 gap-3 items-center w-full"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <div className="flex-1 bg-neutral-800 p-4 rounded-2xl ">
            <input
              value={curMessage}
              onChange={(e) => setCurMessage(e.target.value)}
              className="w-full bg-transparent outline-none text-xl placeholder:font-semibold "
              placeholder="Message"
            />
          </div>
          <button className=" p-1 bg-white rounded-full cursor-pointer">
            <FaArrowUp className="fill-green-500 rounded-full " size={40} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
