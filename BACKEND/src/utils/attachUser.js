import { findUserById } from '../dao/user.dao.js';
import { verifyToken } from './helper.js';
import { getTokenFromRequest, isTokenVersionValid } from './authToken.js';

/**
 * Decodes a valid JWT without a database lookup. Used globally so health checks
 * and 404s are not charged a user query when a stale cookie is present.
 */
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

/**
 * Loads req.user when a valid token was decoded. Use only on routes that need
 * optional authentication (e.g. public create with logged-in dedup).
 */
export const loadUserIfAuthenticated = async (req, res, next) => {
  if (!req.authUserId) {
    return next();
  }

  try {
    const user = await findUserById(req.authUserId);
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
