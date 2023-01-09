import { FaSpinner } from "react-icons/fa";
const Loader = () => {
  return (
    <div className="w-full h-full flex justify-center items-center">
      <div className="animate-spin">
        <FaSpinner size={40} />
      </div>
    </div>
  );
};
export default Loader;
