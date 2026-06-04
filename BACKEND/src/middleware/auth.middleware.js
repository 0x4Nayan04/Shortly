import { AppError } from '../utils/errorHandler.js';
import {
  authFailureMessage,
  getTokenFromRequest,
  resolveUserFromToken
} from '../utils/authToken.js';

export const isAuthenticated = async (req, res, next) => {
  const token = getTokenFromRequest(req);
  if (!token) {
    return next(new AppError('Access denied. No token provided.', 401));
  }

  const resolved = await resolveUserFromToken(req, token);
  if (resolved.kind !== 'ok') {
    return next(new AppError(authFailureMessage(resolved), 401));
  }

  req.user = resolved.user;
  next();
};

/** Sets req.user when a valid session exists; otherwise continues without error (for GET /me). */
export const optionalAuthenticate = async (req, res, next) => {
  const token = getTokenFromRequest(req);
  if (!token) return next();

  const resolved = await resolveUserFromToken(req, token);
  if (resolved.kind !== 'ok') return next();

  req.user = resolved.user;
  next();
};
