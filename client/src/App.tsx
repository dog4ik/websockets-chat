import { Provider } from "react-redux";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Chat from "./components/Chat";
import SelectChatHint from "./components/SelectChatHint";
import Status from "./components/Status";
import ClientPage from "./pages/ClientPage";
import ErrorPage from "./pages/ErrorPage";
import Home from "./pages/Home";
import SocketProvider from "./SocketContext";
import { store } from "./store";

function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Home />,
      errorElement: <ErrorPage />,
      children: [
        {
          path: "/",
          element: <Status />,
        },
        {
          path: "chats",
          element: <SelectChatHint />,
        },
        {
          path: "chats/:chatId",
          loader: ({ params }) => {
            return params.chatId;
          },
          element: <Chat />,
        },
      ],
    },

    {
      path: "/client",
      element: <ClientPage />,
      errorElement: <ErrorPage />,
    },
  ]);
  return (
    <Provider store={store}>
      <SocketProvider>
        <div className="bg-black text-white h-screen w-screen">
          <RouterProvider router={router} />
        </div>
      </SocketProvider>
    </Provider>
  );
}

export default App;
