import { registerUser, loginUser } from "../services/auth.services.js";
import { findUserById } from "../dao/user.dao.js";
import { cookieOptions } from "../config/config.js";
import { ERROR_MESSAGES, SUCCESS_MESSAGES, successResponse, errorResponse } from "../utils/responseMessages.js";

export const register_user = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json(
        errorResponse(ERROR_MESSAGES.VALIDATION.REQUIRED_FIELDS)
      );
    }

    const token = await registerUser(name, email, password);
    res.cookie("token", token, cookieOptions);
    res.status(201).json(successResponse(SUCCESS_MESSAGES.AUTH.REGISTER_SUCCESS, { token }));
  } catch (error) {
    next(error); // Pass errors to the centralized error handler
  }
};

export const login_user = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json(errorResponse(ERROR_MESSAGES.VALIDATION.REQUIRED_FIELDS));
    }

    const { token, user } = await loginUser(email, password);

    res
      .cookie("token", token, cookieOptions)
      .status(200)
      .json(successResponse(SUCCESS_MESSAGES.AUTH.LOGIN_SUCCESS, { user, token }));
  } catch (error) {
    next(error);
  }
};

export const logout_user = (req, res, next) => {
  try {
    res.clearCookie("token", { ...cookieOptions }); // Ensure secure for production
    res
      .status(200)
      .json({ success: true, message: "User logged out successfully" });
  } catch (error) {
    next(error);
  }
};

export const get_user_profile = async (req, res, next) => {
  try {
    const userId = req.user.id; // Assuming 'isLoggedIn' middleware attaches user to req
    const user = await findUserById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    // Optionally remove password before sending
    user.password = undefined;
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};
