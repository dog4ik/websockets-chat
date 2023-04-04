import { FaRedo } from "react-icons/fa";
import { Link } from "react-router-dom";
import useConnection from "../hooks/useConnection";
import { useSocketContext } from "../SupportSocketContext";
import { selectClients, useClientsQuery } from "../store";
import { useSelector } from "react-redux";
type ChatProps = {
  name: string;
  lastMsg?: string;
  isOnline: boolean;
};
const Chat = ({ name, lastMsg }: ChatProps) => {
  return (
    <Link
      to={`/chats/${name}`}
      className="flex h-20 w-full cursor-pointer flex-col items-start justify-between px-5 transition-colors duration-200 hover:bg-neutral-700"
    >
      <span className="w-full truncate">{name}</span>
      {lastMsg && <span>{lastMsg}</span>}
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
            let lastMsg = "";
            const messages = clients[client];
            if (messages) {
              lastMsg = messages[messages?.length - 1]?.text ?? "";
            }
            return (
              <Chat
                name={client}
                lastMsg={lastMsg}
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
