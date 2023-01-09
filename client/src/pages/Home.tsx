import SideBar from "../components/SideBar";
import { Outlet } from "react-router-dom";
const Home = () => {
  return (
    <div className="flex flex-1 h-screen">
      <SideBar />
      <div className="flex-1 h-full">
        <Outlet />
      </div>
    </div>
  );
};

export default Home;
