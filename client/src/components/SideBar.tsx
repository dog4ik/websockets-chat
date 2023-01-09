import React from "react";
import { Link } from "react-router-dom";
type ChatProps = {
  name: string;
};
const Chat = ({ name }: ChatProps) => {
  return (
    <Link
      to={`/chats/${"someone"}`}
      className="w-full h-20 flex justify-between px-5 items-center hover:bg-neutral-700 transition-colors duration-200 cursor-pointer"
    >
      <span>{name}</span>
    </Link>
  );
};
const SideBar = () => {
  return (
    <div className="h-screen overflow-y-auto w-80 bg-neutral-800">
      <div className="h-20 bg-neutral-900 px-5 flex items-center">
        <span className="text-3xl">Chats</span>
      </div>
      <div className="flex flex-col divide-y divide-neutral-700">
        <Chat name="sara" />
        <Chat name="sara" />
        <Chat name="sara" />
        <Chat name="sara" />
        <Chat name="sara" />
        <Chat name="sara" />
        <Chat name="sara" />
        <Chat name="sara" />
        <Chat name="sara" />
        <Chat name="sara" />
      </div>
    </div>
  );
};

export default SideBar;
