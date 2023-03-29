import SideBar from "../components/SideBar";
import { Outlet } from "react-router-dom";
import SupportSocketProvider from "../SupportSocketContext";
const Home = () => {
  return (
    <SupportSocketProvider>
      <div className="flex flex-1 h-screen">
        <SideBar />
        <div className="flex-1 w-2/3 h-full">
          <Outlet />
        </div>
      </div>
    </SupportSocketProvider>
  );
};

export default Home;
