import jwt from "jsonwebtoken";
import { UnauthenticatedError } from "../utils/errors.js";

const machineAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith("Bearer")) {
    throw new UnauthenticatedError("Authentication Invalid");
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.EXPAPP_JWT_SECRET);
    req.machine = { mid: payload.mid };
    next();
  } catch (error) {
    throw new UnauthenticatedError("Authentication Invalid");
  }
};

export default machineAuth;
