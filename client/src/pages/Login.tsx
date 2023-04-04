import Input from "../components/ui/Input";

const Login = () => {
  return (
    <div className="flex w-screen items-center justify-center">
      <div className="flex w-96 max-w-2xl items-center justify-center rounded-xl bg-neutral-700 p-10">
        <form className=" flex flex-col items-center gap-5">
          <span className="text-center text-2xl text-white">Welcome</span>
          <Input label="Login" />
        </form>
      </div>
    </div>
  );
};

export default Login;
