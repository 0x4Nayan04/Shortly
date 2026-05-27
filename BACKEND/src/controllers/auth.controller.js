import { registerUser, loginUser, changePassword, requestPasswordReset, resetPassword } from "../services/auth.services.js";
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

export const logout_user = asyncHandler((req, res, _next) => {
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

export const change_password = asyncHandler(async (req, res, next) => {
  const body = req.validatedBody || req.body;
  const { oldPassword, newPassword } = body;

  if (!oldPassword || !newPassword) {
    return next(new AppError(ERROR_MESSAGES.VALIDATION.REQUIRED_FIELDS, 400));
  }

  const { token, user } = await changePassword(req.user._id, oldPassword, newPassword);
  res
    .cookie("token", token, cookieOptions)
    .status(200)
    .json(successResponse("Password updated successfully", { user }));
});

export const request_password_reset = asyncHandler(async (req, res, _next) => {
  const { email } = req.validatedBody || req.body;
  const result = await requestPasswordReset(email);
  res.status(200).json(successResponse(result.message));
});

export const reset_password = asyncHandler(async (req, res, _next) => {
  const { token, password } = req.validatedBody || req.body;
  const { token: jwtToken, user } = await resetPassword(token, password);
  res
    .cookie("token", jwtToken, cookieOptions)
    .status(200)
    .json(successResponse("Password reset successfully", { user }));
});
