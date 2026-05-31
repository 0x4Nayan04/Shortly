import { AppError } from '../utils/errorHandler.js';
import User from '../schema/user.model.js';
import { verifyToken } from '../utils/helper.js';
import {
  getTokenFromRequest,
  isTokenVersionValid
} from '../utils/authToken.js';
export const isAuthenticated = async (req, res, next) => {
  const token = getTokenFromRequest(req);

  if (!token) {
    return next(new AppError('Access denied. No token provided.', 401));
  }

  let decoded;
  try {
    decoded = await verifyToken(token);
  } catch (jwtError) {
    if (jwtError.name === 'TokenExpiredError') {
      return next(new AppError('Token has expired. Please login again.', 401));
    }
    if (jwtError.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token. Please login again.', 401));
    }
    return next(new AppError('Token verification failed.', 401));
  }

  if (
    req.user &&
    req.user._id.toString() === decoded.id.toString() &&
    isTokenVersionValid(req.user, decoded)
  ) {
    return next();
  }

  const user = await User.findById(decoded.id);

  if (!user) {
    return next(new AppError('Invalid token. Please login again.', 401));
  }

  if (!isTokenVersionValid(user, decoded)) {
    return next(new AppError('Session revoked. Please login again.', 401));
  }

  user.password = undefined;
  req.user = user;
  next();
};
