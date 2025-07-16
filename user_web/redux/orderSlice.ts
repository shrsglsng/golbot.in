import { createSlice } from "@reduxjs/toolkit";
import { AppState } from "./store";
import { HYDRATE } from "next-redux-wrapper";
import { OrderModel } from "../models/orderModel";

// Initial state
const initialState: { order: OrderModel | undefined } = {
  order: undefined,
};

// Actual Slice
export const orderSlice = createSlice({
  name: "orderSlice",
  initialState,
  reducers: {
    updateOrder: (state, action) => {
      // console.log({ ...state.order, ...action.payload.order });
      state.order = { ...state.order, ...action.payload.order };
      // console.log("state.order");
      // state.order = {
      //   uid: "6436bc19e2a113c8db135bf3",
      //   machineId: "m01",
      //   ostatus: "PENDING",
      //   orderCompleted: false,
      //   oid: "648d3061dd99d0cab591e650",
      // };
      // console.log(state.order);
    },

    // TODO: fix this
    // Special reducer for hydrating the state. Special case for next-redux-wrapper
    extraReducers: {
      // @ts-ignore
      [HYDRATE]: (state, action) => {
        return (state = {
          ...state,
          ...action.payload.orderSlice,
        });
      },
    },
  },
});

export const { updateOrder } = orderSlice.actions;

export const selectOrder = (state: AppState) => state.orderSlice.order;

export default orderSlice.reducer;
