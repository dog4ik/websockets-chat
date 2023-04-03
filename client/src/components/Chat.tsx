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
      className={`h-fit w-fit max-w-xs rounded-2xl p-2 text-xl font-semibold md:max-w-lg
    ${isMine ? "self-end bg-sky-500" : "bg-neutral-600"}`}
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
      className="flex h-screen w-full flex-col overflow-y-scroll"
    >
      <div className="sticky top-0 left-0 right-0 flex h-20 gap-3 bg-neutral-800 p-2">
        <div className="aspect-square h-16 rounded-full bg-orange-500" />
        <div className="flex w-2/3 flex-col justify-between py-2">
          <span className="truncate text-2xl">{name}</span>
          <div className="flex items-center gap-2">
            <span>Status:</span>
            <div
              className={`h-2 rounded-full ${"bg-green-500"} aspect-square`}
            />
          </div>
        </div>
      </div>
      <div className="flex flex-1 shrink-0 flex-col justify-end bg-neutral-900 ">
        <div className="flex flex-col gap-4 px-10">
          {client[name]?.map((msg) => (
            <MessageBubble key={v4()} isMine={msg.isMine} text={msg.text} />
          ))}
        </div>
        <form
          className="sticky bottom-0 flex h-16 w-full items-center gap-3 px-5"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <div className="flex-1 rounded-2xl bg-neutral-800 p-4 ">
            <input
              value={curMessage}
              onChange={(e) => setCurMessage(e.target.value)}
              className="w-full bg-transparent text-xl outline-none placeholder:font-semibold "
              placeholder="Message"
              ref={inputRef}
            />
          </div>
          <button className=" cursor-pointer rounded-full bg-white p-1">
            <FaArrowUp className="rounded-full fill-green-500 " size={40} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
