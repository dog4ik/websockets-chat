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
    <div className="flex h-screen items-center justify-center text-white">
      <div className="flex w-2/3 flex-col items-center justify-center gap-10 rounded-xl bg-neutral-800 py-10">
        <div
          className={`rounded-full p-2 ${
            isConnected ? "bg-green-500" : "bg-red-500"
          }`}
        ></div>
        <span className="text-4xl">
          {isConnected ? "Connected" : "Disconnected"}
        </span>
        <div>
          <button
            className="rounded-xl bg-white px-7 py-3 font-semibold text-black"
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
