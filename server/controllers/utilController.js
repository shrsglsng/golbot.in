import { StatusCodes } from "http-status-codes";
import Item from "../models/itemModel.js";

// ----------------------------------------------------------------
// Get all available menu items
export const getAllItems = async (req, res) => {
  const items = await Item.find({ isAvailable: true }).select("-__v -updatedAt");

  res.status(StatusCodes.OK).json({
    result: { items }
  });
};
