import { AppError } from '../utils/errorHandler.js';
import { findUserById } from '../dao/user.dao.js';
import { verifyToken } from '../utils/helper.js';
import {
  getTokenFromRequest,
  isTokenVersionValid
} from '../utils/authToken.js';
import { logger } from '../utils/logger.js';

/**
 * Middleware to check if user is authenticated.
 * Reuses req.user when loadUserIfAuthenticated already loaded a matching session.
 */
export const isAuthenticated = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      return next(new AppError('Access denied. No token provided.', 401));
    }

    try {
      const decoded = await verifyToken(token);

      if (
        req.user &&
        req.user._id.toString() === decoded.id.toString() &&
        isTokenVersionValid(req.user, decoded)
      ) {
        return next();
      }

      const user = await findUserById(decoded.id);

      if (!user) {
        return next(new AppError('Invalid token. Please login again.', 401));
      }

      if (!isTokenVersionValid(user, decoded)) {
        return next(new AppError('Session revoked. Please login again.', 401));
      }

      user.password = undefined;
      req.user = user;

      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return next(
          new AppError('Token has expired. Please login again.', 401)
        );
      }
      if (jwtError.name === 'JsonWebTokenError') {
        return next(new AppError('Invalid token. Please login again.', 401));
      }
      return next(new AppError('Token verification failed.', 401));
    }
  } catch (error) {
    logger.error('Authentication middleware error', { error: error.message });
    return next(new AppError('Authentication failed.', 500));
  }
};
