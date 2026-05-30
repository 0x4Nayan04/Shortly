import { findUserById } from '../dao/user.dao.js';
import { verifyToken } from './helper.js';
import { getTokenFromRequest, isTokenVersionValid } from './authToken.js';

export const attachUser = async (req, res, next) => {
  const token = getTokenFromRequest(req);
  if (!token) {
    return next();
  }

  try {
    const decoded = await verifyToken(token);
    const user = await findUserById(decoded.id);
    if (!user || !isTokenVersionValid(user, decoded)) {
      return next();
    }
    user.password = undefined;
    req.user = user;
  } catch {
    return next();
  }

  next();
};
