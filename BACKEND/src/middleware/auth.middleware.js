import { AppError } from "../utils/errorHandler.js";
import { findUserById } from "../dao/user.dao.js";
import { verifyToken } from "../utils/helper.js";

/**
 * Middleware to check if user is authenticated
 * Verifies JWT token from Authorization header or cookies
 */
export const isAuthenticated = async (req, res, next) => {
  try {
    let token;

    // Check for token in cookies
    if (req.cookies.token) {
      token = req.cookies.token;
    }

    // Check for token in Authorization header
    if (!token) {
      const authHeader = req.headers?.authorization;
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.slice(7);
      }
    }

    // If no token found
    if (!token) {
      return next(new AppError("Access denied. No token provided.", 401));
    }

    try {
      // Verify the token
      const decoded = await verifyToken(token);

      // Find the user by ID from token payload
      const user = await findUserById(decoded.id);

      if (!user) {
        return next(new AppError("User not found. Token may be invalid.", 401));
      }

      if (
        decoded?.tokenVersion !== undefined &&
        (user.tokenVersion ?? 0) !== decoded.tokenVersion
      ) {
        return next(new AppError("Session revoked. Please login again.", 401));
      }

      // Attach user to request object (remove password)
      user.password = undefined;
      req.user = user;

      next();
    } catch (jwtError) {
      if (jwtError.name === "TokenExpiredError") {
        return next(
          new AppError("Token has expired. Please login again.", 401)
        );
      } else if (jwtError.name === "JsonWebTokenError") {
        return next(new AppError("Invalid token. Please login again.", 401));
      } else {
        return next(new AppError("Token verification failed.", 401));
      }
    }
  } catch (error) {
    console.error("Authentication middleware error:", error);
    return next(new AppError("Authentication failed.", 500));
  }
};
