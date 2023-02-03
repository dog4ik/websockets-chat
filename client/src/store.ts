import { configureStore, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const chatApi = createApi({
  reducerPath: "chatApi",
  baseQuery: fetchBaseQuery({ baseUrl: import.meta.env.VITE_SERVER_URL }),
  endpoints: (build) => {
    return {
      getClients: build.query<{ clients: string[] }, undefined>({
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

const clientsSlice = createSlice({
  name: "clients",
  initialState: { list: [] as string[] },
  reducers: {
    setClients: (state, action: PayloadAction<string[]>) => {
      state.list = action.payload;
    },
  },
});

export const { setClients } = clientsSlice.actions;

export const store = configureStore({
  reducer: {
    clients: clientsSlice.reducer,
    chatApi: chatApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(chatApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;

export const selectClients = (state: RootState) => state.clients.list;
