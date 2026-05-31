import User from '../schema/user.model.js';
import { verifyToken } from './helper.js';
import { getTokenFromRequest, isTokenVersionValid } from './authToken.js';

export const attachUser = async (req, res, next) => {
  const token = getTokenFromRequest(req);
  if (!token) {
    return next();
  }

  try {
    const decoded = await verifyToken(token);
    req.authUserId = decoded.id;
    req.authTokenVersion = decoded.tokenVersion;
  } catch {
    return next();
  }

  next();
};

export const loadUserIfAuthenticated = async (req, res, next) => {
  if (!req.authUserId) {
    return next();
  }

  try {
    const user = await User.findById(req.authUserId);
    if (
      !user ||
      !isTokenVersionValid(user, { tokenVersion: req.authTokenVersion })
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
