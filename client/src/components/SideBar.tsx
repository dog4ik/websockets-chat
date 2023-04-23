import { FaRedo } from "react-icons/fa";
import { Link } from "react-router-dom";
import useConnection from "../hooks/useConnection";
import { useSocketContext } from "../SupportSocketContext";
import { ChatMessageType, selectClients, useClientsQuery } from "../store";
import { useSelector } from "react-redux";
type ChatProps = {
  name: string;
  lastMsg?: ChatMessageType;
  unreadedAmount: number;
  isOnline: boolean;
};
const Chat = ({ name, lastMsg, unreadedAmount }: ChatProps) => {
  return (
    <Link
      to={`/chats/${name}`}
      className="flex h-20 w-full cursor-pointer flex-col items-start justify-center px-5 transition-colors duration-200 hover:bg-neutral-700"
    >
      <span className="w-full truncate text-lg">{name.split("-")[0]}</span>
      {lastMsg && (
        <div className="flex w-full items-center gap-2">
          <span className="text-white/80">
            {lastMsg.isMine ? "Me:" : "Him:"}
          </span>
          <span className="w-full truncate text-sm">{lastMsg.text}</span>
          {unreadedAmount ? (
            <div className="flex aspect-square h-8 items-center justify-center rounded-full bg-white">
              <span className="text-black">{unreadedAmount}</span>
            </div>
          ) : null}
        </div>
      )}
    </Link>
  );
};
const SideBar = () => {
  const { socketId } = useSocketContext();
  const clientQuery = useClientsQuery(socketId ?? "");
  const clients = useSelector(selectClients);
  useConnection({
    onRefresh() {
      clientQuery.refetch();
    },
  });
  if (!clientQuery.data) return null;
  return (
    <div className="h-screen w-80 overflow-y-auto bg-neutral-800">
      <div className="flex h-20 items-center gap-5 bg-neutral-900 px-5">
        <span className="text-3xl">Chats</span>
        <div className="cursor-pointer p-2" onClick={clientQuery.refetch}>
          <FaRedo size={20} />
        </div>
      </div>
      <div className="flex flex-col divide-y divide-neutral-700">
        {clientQuery.data
          ?.filter((item) => item != socketId)
          .map((client) => {
            const messages = clients[client];
            let lastMsg = undefined;
            let unreaded = 0;
            if (messages) {
              unreaded = messages.reduce((sum, msg) => {
                if (!msg.isReaded && !msg.isMine) return sum + 1;
                else return sum;
              }, 0);
              lastMsg = messages[messages?.length - 1];
            }
            return (
              <Chat
                name={client}
                lastMsg={lastMsg}
                unreadedAmount={unreaded}
                isOnline={true}
                key={client}
              />
            );
          })}
      </div>
    </div>
  );
};

export default SideBar;
