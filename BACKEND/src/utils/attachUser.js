import jwt from "jsonwebtoken";
import { findUserById } from "../dao/user.dao.js";

const getTokenFromRequest = (req) => {
  const cookieToken = req.cookies?.token;
  if (cookieToken) return cookieToken;
  const authHeader = req.headers?.authorization;
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7);
  return null;
};

export const attachUser = async (req, res, next) => {
  const token = getTokenFromRequest(req);
  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await findUserById(decoded.id);
    if (!user) {
      return next();
    }
    req.user = user;
  } catch {
    return next();
  }

  next();
};
