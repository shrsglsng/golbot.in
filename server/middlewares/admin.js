import jwt from "jsonwebtoken";
import { UnauthenticatedError } from "../utils/errors.js";
import Admin from "../models/adminModel.js";

const auth = async (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith("Bearer")) {
    throw new UnauthenticatedError("Admin Authorization Invalid");
  }

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.EXPAPP_JWT_SECRET);

    const admin = await Admin.findOne({ email: payload.email });

    if (!admin) throw new UnauthenticatedError("Admin Authorization Invalid");
    next();
  } catch (error) {
    throw new UnauthenticatedError("Admin Authorization Invalid");
  }
};

export default auth;
