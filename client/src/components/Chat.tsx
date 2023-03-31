import { useEffect, useRef, useState } from "react";
import { FaArrowUp } from "react-icons/fa";
import { useLoaderData } from "react-router-dom";
import { useSocketContext } from "../SupportSocketContext";
import { v4 } from "uuid";
import { clientActions, selectClients } from "../store";
import useConnection from "../hooks/useConnection";
import { useDispatch, useSelector } from "react-redux";
type MessageProps = {
  text: string;
  isMine: boolean;
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
  const { send } = useSocketContext();
  const name = useLoaderData() as string;
  const inputRef = useRef<HTMLInputElement>(null);
  const [curMessage, setCurMessage] = useState("");
  const msgContainerRef = useRef<HTMLDivElement>(null);
  const client = useSelector(selectClients);
  const dispatch = useDispatch();

  useConnection({
    onMessage(msg) {
      dispatch(
        clientActions.pushMessage({
          id: msg.from,
          message: {
            text: msg.message,
            isMine: false,
            date: new Date().toString(),
          },
        })
      );
    },
  });
  const handleSend = () => {
    if (curMessage.trim() === "") return;
    send(curMessage, name);
    dispatch(
      clientActions.pushMessage({
        id: name,
        message: {
          text: curMessage,
          isMine: true,
          date: new Date().toString(),
        },
      })
    );
    setCurMessage("");
  };
  useEffect(() => {
    msgContainerRef.current?.scrollTo(0, msgContainerRef.current.scrollHeight);
  }, [client[name]?.length]);
  useEffect(() => {
    if (!client[name]) dispatch(clientActions.addClient(name));
    inputRef.current?.focus();
    msgContainerRef.current?.scrollTo(0, msgContainerRef.current.scrollHeight);
  }, [name]);

  return (
    <div
      ref={msgContainerRef}
      className="w-full flex h-screen overflow-y-scroll flex-col"
    >
      <div className="flex gap-3 bg-neutral-800 sticky top-0 left-0 right-0 p-2 h-20">
        <div className="h-16 rounded-full bg-orange-500 aspect-square" />
        <div className="flex flex-col w-2/3 justify-between py-2">
          <span className="text-2xl truncate">{name}</span>
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
          {client[name]?.map((msg) => (
            <MessageBubble key={v4()} isMine={msg.isMine} text={msg.text} />
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
              ref={inputRef}
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
