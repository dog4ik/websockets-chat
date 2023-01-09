import { Link } from "react-router-dom";
const ErrorPage = () => {
  return (
    <div className="h-full w-full flex flex-col justify-center gap-5 items-center">
      <span className="text-4xl">Error</span>
      <div>
        <Link
          to={"/"}
          className="px-5 py-3 rounded-xl bg-white text-black font-semibold"
        >
          Main page
        </Link>
      </div>
    </div>
  );
};

export default ErrorPage;
