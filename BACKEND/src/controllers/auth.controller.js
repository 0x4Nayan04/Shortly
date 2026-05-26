import { registerUser, loginUser } from "../services/auth.services.js";
import { findUserById } from "../dao/user.dao.js";
import { cookieOptions } from "../config/config.js";
import { AppError, NotFoundError } from "../utils/errorHandler.js";
import asyncHandler from "../utils/asyncHandler.js";
import { ERROR_MESSAGES, SUCCESS_MESSAGES, successResponse } from "../utils/responseMessages.js";

export const register_user = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return next(new AppError(ERROR_MESSAGES.VALIDATION.REQUIRED_FIELDS, 400));
  }

  const { token, user } = await registerUser(name, email, password);
  res.cookie("token", token, cookieOptions);
  res
    .status(201)
    .json(successResponse(SUCCESS_MESSAGES.AUTH.REGISTER_SUCCESS, { user }));
});

export const login_user = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError(ERROR_MESSAGES.VALIDATION.REQUIRED_FIELDS, 400));
  }

  const { token, user } = await loginUser(email, password);

  res
    .cookie("token", token, cookieOptions)
    .status(200)
    .json(successResponse(SUCCESS_MESSAGES.AUTH.LOGIN_SUCCESS, { user }));
});

export const logout_user = asyncHandler((req, res, next) => {
  res.clearCookie("token", { ...cookieOptions }); // Ensure secure for production
  res
    .status(200)
    .json(successResponse(SUCCESS_MESSAGES.AUTH.LOGOUT_SUCCESS));
});

export const get_user_profile = asyncHandler(async (req, res, next) => {
  const userId = req.user.id; // Assuming 'isLoggedIn' middleware attaches user to req

  const user = await findUserById(userId);
  if (!user) {
    return next(new NotFoundError("User not found"));
  }
  // Optionally remove password before sending
  user.password = undefined;
  res.status(200).json(successResponse("User profile fetched", { user }));
});
