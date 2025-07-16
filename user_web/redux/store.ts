import { configureStore, ThunkAction, Action } from "@reduxjs/toolkit";
import { cartSlice } from "./cartSlice";
import { createWrapper } from "next-redux-wrapper";
import { userSlice } from "./userSlice";
import { orderSlice } from "./orderSlice";

const makeStore = () =>
  configureStore({
    reducer: {
      [orderSlice.name]: orderSlice.reducer,
      [cartSlice.name]: cartSlice.reducer,
      [userSlice.name]: userSlice.reducer,
    },
    devTools: true,
  });

export type AppStore = ReturnType<typeof makeStore>;
export type AppState = ReturnType<AppStore["getState"]>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  AppState,
  unknown,
  Action
>;

export const wrapper = createWrapper<AppStore>(makeStore);
