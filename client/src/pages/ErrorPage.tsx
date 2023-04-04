import { Link } from "react-router-dom";
const ErrorPage = () => {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-5">
      <span className="text-4xl">Error</span>
      <div>
        <Link
          to={"/"}
          className="rounded-xl bg-white px-5 py-3 font-semibold text-black"
        >
          Main page
        </Link>
      </div>
    </div>
  );
};

export default ErrorPage;
