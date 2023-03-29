import { useSocketContext } from "../SupportSocketContext";
const Status = () => {
  const { socket, isConnected } = useSocketContext();
  socket.on("error", (error) => {
    console.log(error);
  });
  const sendPing = () => {
    socket.emit("ping", "ping");
  };
  return (
    <div className="flex h-screen justify-center items-center text-white">
      <div className="w-2/3 rounded-xl py-10 bg-neutral-800 flex justify-center items-center gap-10 flex-col">
        <div
          className={`p-2 rounded-full ${
            isConnected ? "bg-green-500" : "bg-red-500"
          }`}
        ></div>
        <span className="text-4xl">
          {isConnected ? "Connected" : "Disconnected"}
        </span>
        <div>
          <button
            className="px-7 py-3 font-semibold bg-white text-black rounded-xl"
            onClick={() => sendPing()}
          >
            Ping
          </button>
        </div>
      </div>
    </div>
  );
};

export default Status;
