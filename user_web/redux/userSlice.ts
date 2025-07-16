import { createSlice } from "@reduxjs/toolkit";
import { AppState } from "./store";
import { HYDRATE } from "next-redux-wrapper";
import { UserModel } from "../models/userModel";

// Initial state
const initialState: { user: UserModel | undefined } = {
  user: undefined,
};

// Actual Slice
export const userSlice = createSlice({
  name: "userSlice",
  initialState,
  reducers: {
    updateToken: (state, action) => {
      state.user = { ...state.user, token: action.payload.token };
    },

    // TODO: fix this
    // Special reducer for hydrating the state. Special case for next-redux-wrapper
    extraReducers: {
      // @ts-ignore
      [HYDRATE]: (state, action) => {
        return (state = {
          ...state,
          ...action.payload.userSlice,
        });
      },
    },
  },
});

export const { updateToken } = userSlice.actions;

export const selectUser = (state: AppState) => state.userSlice.user;

export default userSlice.reducer;
