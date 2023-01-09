import { useState } from "react";
import { FaArrowUp } from "react-icons/fa";
import { useSocketContext } from "../SocketContext";

const ClientPage = () => {
  const { socket, isConnected } = useSocketContext();
  const [message, setMessage] = useState("");
  const handleSent = () => {
    socket.emit("send", message);
  };
  return (
    <div className="flex justify-center items-center">
      <div className="h-96 w-60 bg-neutral-700 rounded-lg flex flex-col">
        <div className="flex-1 flex"></div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSent();
          }}
          className=" p-2 flex rounded-lg"
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
