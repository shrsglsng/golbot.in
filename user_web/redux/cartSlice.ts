import { createSlice } from "@reduxjs/toolkit";
import { AppState } from "./store";
import { HYDRATE } from "next-redux-wrapper";
import { ItemModel } from "../models/itemModel";

// Initial state
const initialState: { items: ItemModel[] } = {
  items: [
    {
      id: "GOL",
      name: "Golgappa",
      desc: "Tasty puris, baked potatos, peas and onions.",
      imgUrl: "/singlePuri.png",
      price: 30,
      quantity: 0,
      gst: 1.5,
    },
    {
      id: "PAN",
      name: "Pani Puri",
      desc: "Tasty puris, baked potatos, peas onions and sev.",
      imgUrl: "/paniPuri.png",
      price: 30,
      quantity: 0,
      gst: 1.5,
    },
    {
      id: "PWO",
      name: "Pani Puri without Onions",
      desc: "Tasty puris, baked potatos, peas and sev.",
      imgUrl: "/paniPuri.png",
      price: 30,
      quantity: 0,
      gst: 1.5,
    },
  ],
};
// Actual Slice
export const cartSlice = createSlice({
  name: "cartSlice",
  initialState,
  reducers: {
    updateCart: (state, action) => {
      // console.log(action.payload);
      state.items = [
        ...state.items.slice(0, action.payload.index),
        action.payload.item,
        ...state.items.slice(action.payload.index + 1),
      ];
    },

    setItems: (state, action) => {
      // console.log(action.payload);
      state.items = [...action.payload.allItems];
    },

    // TODO: fix this
    // Special reducer for hydrating the state. Special case for next-redux-wrapper
    extraReducers: {
      // @ts-ignore
      [HYDRATE]: (state, action) => {
        return (state = {
          ...state,
          ...action.payload.cartSlice,
        });
      },
    },
  },
});

export const { updateCart, setItems } = cartSlice.actions;

export const selectCart = (state: AppState) => state.cartSlice.items;
// export const selectAdditionalFile = (state: AppState) =>
//   state.cartSlice.additonalFile;

export default cartSlice.reducer;
