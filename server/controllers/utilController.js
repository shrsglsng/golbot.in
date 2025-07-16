import { StatusCodes } from "http-status-codes";
import Items from "../models/itemModel.js";
import { BadRequestError, UnauthenticatedError } from "../utils/errors.js";

export const getAllItems = async (req, res) => {
  const items = await Items.find({}, { _id: 0 });
  res.status(StatusCodes.OK).json({ items });
};
