import jwt from "jsonwebtoken";
import { UnauthenticatedError } from "../utils/errors.js";

const auth = async (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith("Bearer")) {
    throw new UnauthenticatedError("Please login to continue");
  }

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.EXPAPP_JWT_SECRET);
    req.user = { uid: payload.uid, phone: payload.phone };
    next();
  } catch (error) {
    throw new UnauthenticatedError("Session expired. Please login again");
  }
};

export default auth;
