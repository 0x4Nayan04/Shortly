import { findUserById } from '../dao/user.dao.js';
import { verifyToken } from './helper.js';

const getTokenFromRequest = (req) => {
  const cookieToken = req.cookies?.token;
  if (cookieToken) return cookieToken;
  const authHeader = req.headers?.authorization;
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);
  return null;
};

export const attachUser = async (req, res, next) => {
  const token = getTokenFromRequest(req);
  if (!token) {
    return next();
  }

  try {
    const decoded = await verifyToken(token);
    const user = await findUserById(decoded.id);
    if (!user) {
      return next();
    }
    if (
      decoded?.tokenVersion !== undefined &&
      (user.tokenVersion ?? 0) !== decoded.tokenVersion
    ) {
      return next();
    }
    user.password = undefined;
    req.user = user;
  } catch {
    return next();
  }

  next();
};
