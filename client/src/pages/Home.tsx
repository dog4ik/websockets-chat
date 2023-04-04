import SideBar from "../components/SideBar";
import { Outlet } from "react-router-dom";
import SupportSocketProvider from "../SupportSocketContext";
const Home = () => {
  return (
    <SupportSocketProvider>
      <div className="flex h-screen flex-1">
        <SideBar />
        <div className="h-full w-2/3 flex-1">
          <Outlet />
        </div>
      </div>
    </SupportSocketProvider>
  );
};

export default Home;
