import Input from "../components/ui/Input";

const Login = () => {
  return (
  <div className="w-screen flex justify-center items-center">
    <div className="flex justify-center items-center rounded-xl max-w-2xl w-96 p-10 bg-neutral-700">
      <form className=" flex flex-col items-center gap-5">
        <span className="text-white text-2xl text-center">Welcome</span>
        <Input label="Login" />
      </form>
    </div>
    </div>
  );
};

export default Login;
