import jwt from "jsonwebtoken";
import { AppError } from "../utlis/errorHandler.js";
import { findUserById } from "../dao/user.dao.js";

/**
 * Middleware to check if user is authenticated
 * Verifies JWT token from Authorization header or cookies
 */
export const isAuthenticated = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header (Bearer token)
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }
    // Check for token in cookies (fallback)
    else if (req.cookies.token) {
      token = req.cookies.token;
    }

    // If no token found
    if (!token) {
      return next(new AppError("Access denied. No token provided.", 401));
    }

    try {
      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find the user by ID from token payload
      const user = await findUserById(decoded.id);

      if (!user) {
        return next(new AppError("User not found. Token may be invalid.", 401));
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

/**
 * Optional authentication middleware
 * Adds user to request if token is valid, but doesn't require authentication
 */
export const optionalAuth = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header or cookies
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.token) {
      token = req.cookies.token;
    }

    // If no token, continue without user
    if (!token) {
      req.user = null;
      return next();
    }

    try {
      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find the user by ID
      const user = await findUserById(decoded.id);

      if (user) {
        user.password = undefined;
        req.user = user;
      } else {
        req.user = null;
      }
    } catch (jwtError) {
      // For optional auth, we don't throw errors for invalid tokens
      req.user = null;
    }

    next();
  } catch (error) {
    console.error("Optional authentication middleware error:", error);
    req.user = null;
    next();
  }
};

/**
 * Middleware to check if user is logged in (simpler version)
 * Can be used as an alias for isAuthenticated
 */
export const requireAuth = isAuthenticated;

/**
 * Middleware to check if user is the owner of a resource
 * Should be used after isAuthenticated middleware
 */
export const isOwner = (resourceUserIdField = "userId") => {
  return (req, res, next) => {
    try {
      // Ensure user is authenticated first
      if (!req.user) {
        return next(new AppError("Authentication required.", 401));
      }

      // Get resource user ID from params, body, or custom field
      const resourceUserId =
        req.params[resourceUserIdField] ||
        req.body[resourceUserIdField] ||
        req.body.user;

      // Check if the authenticated user owns the resource
      if (
        !resourceUserId ||
        req.user._id.toString() !== resourceUserId.toString()
      ) {
        return next(
          new AppError(
            "Access denied. You can only access your own resources.",
            403
          )
        );
      }

      next();
    } catch (error) {
      console.error("Ownership verification error:", error);
      return next(new AppError("Authorization failed.", 500));
    }
  };
};
