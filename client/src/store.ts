import { configureStore, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export type ChatMessageType = {
  text: string;
  isMine: boolean;
  date: Date;
};
const chatApi = createApi({
  reducerPath: "chatApi",
  baseQuery: fetchBaseQuery({ baseUrl: import.meta.env.VITE_SERVER_URL }),
  endpoints: (build) => {
    return {
      getClients: build.query<[string, boolean][], undefined>({
        query: () => "/clients",
      }),
      beGod: build.mutation({
        query: (id: string) => ({
          url: "/begod",
          method: "POST",
          body: { godId: id },
        }),
      }),
    };
  },
});

export const useClientsQuery = chatApi.endpoints.getClients.useQuery;
export const useGodMutation = chatApi.endpoints.beGod.useMutation;

const messagesSlice = createSlice({
  name: "messages",
  initialState: [] as ChatMessageType[],
  reducers: {
    push: (state, action: PayloadAction<ChatMessageType>) => {
      state.push(action.payload);
    },
  },
});

const clientsSlice = createSlice({
  name: "clients",
  initialState: {} as { [id: string]: ChatMessageType[] },
  reducers: {
    addClient: (state, action: PayloadAction<string>) => {
      state[action.payload] = [];
    },
    pushMessage: (
      state,
      action: PayloadAction<{ id: string; message: ChatMessageType }>
    ) => {
      const messages = state[action.payload.id];
      messages?.push(action.payload.message);
    },
    setAllClients: (
      state,
      action: PayloadAction<{ [id: string]: ChatMessageType[] }[]>
    ) => {
      state = action.payload.reduce((acc, curr) => {
        return { ...acc, ...curr };
      }, {});
    },
    removeClient: (state, action: PayloadAction<string>) => {
      delete state[action.payload];
    },
  },
});

export const { addClient, pushMessage, removeClient, setAllClients } =
  clientsSlice.actions;

export const { push } = messagesSlice.actions;

export const store = configureStore({
  reducer: {
    clients: clientsSlice.reducer,
    messages: messagesSlice.reducer,
    chatApi: chatApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(chatApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;

export const selectClients = (state: RootState) => state.clients;
export const selectMessages = (state: RootState) => state.messages;
