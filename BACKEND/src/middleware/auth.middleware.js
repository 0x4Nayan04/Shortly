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

    // Check for token in cookies
    if (req.cookies.token) {
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
