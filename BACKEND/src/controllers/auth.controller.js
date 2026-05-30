import {
  registerUser as registerUserService,
  loginUser as loginUserService,
  changePassword as changePasswordService,
  requestPasswordReset as requestPasswordResetService,
  resetPassword as resetPasswordService
} from '../services/auth.services.js';
import { cookieOptions } from '../config/config.js';
import asyncHandler from '../utils/asyncHandler.js';
import {
  SUCCESS_MESSAGES,
  successResponse
} from '../utils/responseMessages.js';
import { findUserById } from '../dao/user.dao.js';
import { NotFoundError } from '../utils/errorHandler.js';
import { serializeUser } from '../utils/serializeUser.js';

export const registerUser = asyncHandler(async (req, res, _next) => {
  const { name, email, password } = req.validatedBody;
  const { token, user } = await registerUserService(name, email, password);
  res.cookie('token', token, cookieOptions);
  res.status(201).json(
    successResponse(SUCCESS_MESSAGES.AUTH.REGISTER_SUCCESS, {
      user: serializeUser(user)
    })
  );
});

export const loginUser = asyncHandler(async (req, res, _next) => {
  const { email, password } = req.validatedBody;
  const { token, user } = await loginUserService(email, password);

  res
    .cookie('token', token, cookieOptions)
    .status(200)
    .json(
      successResponse(SUCCESS_MESSAGES.AUTH.LOGIN_SUCCESS, {
        user: serializeUser(user)
      })
    );
});

export const logoutUser = asyncHandler(async (req, res, _next) => {
  if (req.user) {
    req.user.tokenVersion = (req.user.tokenVersion ?? 0) + 1;
    await req.user.save();
  }

  res.clearCookie('token', { ...cookieOptions });
  res.status(200).json(successResponse(SUCCESS_MESSAGES.AUTH.LOGOUT_SUCCESS));
});

export const getUserProfile = asyncHandler(async (req, res, next) => {
  const user = await findUserById(req.user._id);
  if (!user) {
    return next(new NotFoundError('User not found'));
  }

  res.status(200).json(
    successResponse('User profile fetched', {
      user: serializeUser(user)
    })
  );
});

export const changePassword = asyncHandler(async (req, res, _next) => {
  const { oldPassword, newPassword } = req.validatedBody;
  const { token, user } = await changePasswordService(
    req.user._id,
    oldPassword,
    newPassword
  );
  res
    .cookie('token', token, cookieOptions)
    .status(200)
    .json(
      successResponse('Password updated successfully', {
        user: serializeUser(user)
      })
    );
});

export const requestPasswordReset = asyncHandler(async (req, res, _next) => {
  const { email } = req.validatedBody;
  const result = await requestPasswordResetService(email);
  res.status(200).json(successResponse(result.message));
});

export const resetPassword = asyncHandler(async (req, res, _next) => {
  const { token, password } = req.validatedBody;
  const { token: jwtToken, user } = await resetPasswordService(token, password);
  res
    .cookie('token', jwtToken, cookieOptions)
    .status(200)
    .json(
      successResponse('Password reset successfully', {
        user: serializeUser(user)
      })
    );
});
