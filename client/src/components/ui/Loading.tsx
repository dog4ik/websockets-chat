import { FaSpinner } from "react-icons/fa";
const Loader = () => {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="animate-spin">
        <FaSpinner size={40} />
      </div>
    </div>
  );
};
export default Loader;
