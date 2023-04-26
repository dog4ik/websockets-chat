import { useEffect, useMemo, useRef, useState } from "react";
import { FaArrowUp, FaCheck, FaClock, FaPlus } from "react-icons/fa";
import { useLoaderData } from "react-router-dom";
import { useSocketContext } from "../SupportSocketContext";
import { clientActions, selectClients, useUploadMutation } from "../store";
import useConnection from "../hooks/useConnection";
import { useDispatch, useSelector } from "react-redux";
import InputFile from "./InputFile";
type MessageProps = {
  text: string;
  isMine: boolean;
  isViewed: boolean;
  isSending: boolean;
  onIntoView: () => void;
};
const options: IntersectionObserverInit = {
  root: null,
  rootMargin: "0px",
  threshold: 0,
};

const StatusMark = ({
  isViewed,
  isSending,
}: {
  isSending: boolean;
  isViewed: boolean;
}) => {
  if (isSending) return <FaClock size={10} />;
  if (isViewed)
    return (
      <div className="relative flex items-center justify-center">
        <FaCheck size={10} />
        <FaCheck className="-translate-x-1/2" size={10} />
      </div>
    );
  return <FaCheck size={10} />;
};
const MessageBubble = ({
  text,
  isViewed,
  isMine,
  onIntoView,
  isSending,
}: MessageProps) => {
  const observableRef = useRef<HTMLDivElement>(null);
  const onObserve = (entires: IntersectionObserverEntry[]) => {
    const [entry] = entires;
    if (entry.isIntersecting && !isViewed) {
      onIntoView();
    }
  };
  useEffect(() => {
    const observer = new IntersectionObserver(onObserve, options);
    if (observableRef.current) observer.observe(observableRef.current);
    return () => {
      if (observableRef.current) observer.unobserve(observableRef.current);
    };
  }, [observableRef.current, options]);

  return (
    <div
      ref={observableRef}
      className={`relative h-fit w-fit max-w-xs rounded-2xl p-2 text-xl font-semibold md:max-w-lg
    ${isMine ? "self-end bg-sky-500" : "bg-neutral-600"}`}
    >
      <p className="mb-2 break-words">{text}</p>
      <div className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center">
        {isMine && <StatusMark isViewed={isViewed} isSending={isSending} />}
      </div>
    </div>
  );
};
const Chat = () => {
  const { send, sendRead } = useSocketContext();
  const name = useLoaderData() as string;
  const inputRef = useRef<HTMLInputElement>(null);
  const [curMessage, setCurMessage] = useState("");
  const [file, setFile] = useState<Uint8Array>();
  const msgContainerRef = useRef<HTMLDivElement>(null);
  const [upload, uploadMutation] = useUploadMutation();
  const client = useSelector(selectClients);
  const dispatch = useDispatch();

  useConnection({
    onMessage(msg) {
      console.log(msg);
      switch (msg.msg.type) {
        case "Text":
          dispatch(
            clientActions.pushMessage({
              id: msg.from,
              message: {
                text: msg.msg.msg,
                id: msg.id,
                isReaded: false,
                isMine: false,
                date: new Date().toString(),
              },
            })
          );
          break;
        case "Image":
          dispatch(
            clientActions.pushMessage({
              id: msg.from,
              message: {
                text: "image",
                id: msg.id,
                isReaded: false,
                isMine: false,
                date: new Date().toString(),
              },
            })
          );
          break;
      }
    },
    onSeen(res) {
      console.log("heh", res.from);
      dispatch(clientActions.readMeassage({ msgId: res.id, userId: res.from }));
    },
  });
  const handleSend = async () => {
    if (curMessage.trim() === "") return;
    if (file) upload(file);
    const { id } = await send(curMessage, name);
    console.log(id);

    dispatch(
      clientActions.pushMessage({
        id: name,
        message: {
          text: curMessage,
          id,
          isReaded: false,
          isMine: true,
          date: new Date().toString(),
        },
      })
    );
    setCurMessage("");
    setFile(undefined);
  };
  const handleRead = (msgId: string) => {
    if (client[name]?.find((item) => msgId === item.id)?.isReaded === true) {
      return;
    }
    sendRead(name, msgId);
  };
  useEffect(() => {
    msgContainerRef.current?.scrollTo(0, msgContainerRef.current.scrollHeight);
  }, [client[name]?.length]);
  useEffect(() => {
    if (!client[name]) dispatch(clientActions.addClient(name));
    inputRef.current?.focus();
    msgContainerRef.current?.scrollTo(0, msgContainerRef.current.scrollHeight);
  }, [name]);
  if (uploadMutation.data) {
    console.log(uploadMutation.data);
  }
  const url = useMemo(
    () =>
      file
        ? URL.createObjectURL(new Blob([file], { type: "image/png" }))
        : "todo",
    [file]
  );

  return (
    <div
      ref={msgContainerRef}
      className="flex h-screen w-full flex-col overflow-y-scroll"
    >
      <div className="sticky left-0 right-0 top-0 flex h-20 gap-3 bg-neutral-800 p-2">
        <div className="aspect-square h-16 rounded-full bg-orange-500" />
        <div className="flex w-2/3 flex-col justify-between py-2">
          <span className="truncate text-2xl">{name.split("-")[0]}</span>
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
            <MessageBubble
              isViewed={msg.isReaded}
              key={msg.id}
              //WARN: todo
              isSending={false}
              isMine={msg.isMine}
              text={msg.text}
              onIntoView={() => {
                handleRead(msg.id);
                if (!msg.isMine)
                  dispatch(
                    clientActions.readMeassage({
                      msgId: msg.id,
                      userId: name,
                    })
                  );
              }}
            />
          ))}
        </div>
        {file && (
          <div className="bg-gradient-to-t from-white/10 to-transparent px-5">
            <div className="relative h-32 w-32">
              <div
                onClick={() => setFile(undefined)}
                className="absolute right-0.5 top-0.5 flex h-8 w-8 rotate-45 cursor-pointer items-center justify-center rounded-full bg-black/80"
              >
                <FaPlus size={20} fill="white" />
              </div>
              <img src={url} className="h-32 w-32 object-cover"></img>
            </div>
          </div>
        )}
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
          <InputFile
            haveFile={!!file}
            onUpload={(file) => {
              setFile(file);
            }}
          />
          <button className=" cursor-pointer rounded-full bg-white p-1">
            <FaArrowUp className="rounded-full fill-green-500 " size={40} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
