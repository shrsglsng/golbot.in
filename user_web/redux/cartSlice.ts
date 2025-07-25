import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AppState } from "./store";
import { HYDRATE } from "next-redux-wrapper";
import { ItemModel } from "../models/itemModel";

// Initial state — no hardcoded items
const initialState: { items: (ItemModel & { quantity: number })[] } = {
  items: [],
};

export const cartSlice = createSlice({
  name: "cartSlice",
  initialState,
  reducers: {
    updateCart: (
      state,
      action: PayloadAction<{ item: ItemModel & { quantity: number }; index: number }>
    ) => {
      state.items = [
        ...state.items.slice(0, action.payload.index),
        action.payload.item,
        ...state.items.slice(action.payload.index + 1),
      ];
    },

    setItems: (
      state,
      action: PayloadAction<{ allItems: (ItemModel & { quantity: number })[] }>
    ) => {
      state.items = [...action.payload.allItems];
    },

    clearCart: (state) => {
      state.items = [];
    },
  },

  extraReducers: (builder) => {
    builder.addCase(HYDRATE, (state, action: any) => {
      return {
        ...state,
        ...action.payload.cartSlice,
      };
    });
  },
});

// Actions
export const { updateCart, setItems, clearCart } = cartSlice.actions;

// Selector
export const selectCart = (state: AppState) => state.cartSlice.items;

export default cartSlice.reducer;
