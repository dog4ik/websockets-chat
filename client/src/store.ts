import { configureStore, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export type ChatMessageType = {
  text: string;
  isMine: boolean;
  date: string;
};
const chatApi = createApi({
  reducerPath: "chatApi",
  baseQuery: fetchBaseQuery({ baseUrl: import.meta.env.VITE_SERVER_URL }),
  endpoints: (build) => {
    return {
      getClients: build.query<string[], string>({
        query: (id) => `/getmyclients?id=${id}`,
      }),
    };
  },
});

export const useClientsQuery = chatApi.endpoints.getClients.useQuery;

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
      if (!state[action.payload.id]) state[action.payload.id] = [];
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

export const clientActions = clientsSlice.actions;

export const store = configureStore({
  reducer: {
    clients: clientsSlice.reducer,
    chatApi: chatApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(chatApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;

export const selectClients = (state: RootState) => state.clients;
