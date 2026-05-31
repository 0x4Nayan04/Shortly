import {
  registerUser as registerUserService,
  loginUser as loginUserService,
  changePassword as changePasswordService,
  requestPasswordReset as requestPasswordResetService,
  resetPassword as resetPasswordService,
  verifyEmail as verifyEmailService,
  updateUserProfile as updateUserProfileService,
  deleteUserAccount as deleteUserAccountService
} from '../services/auth.services.js';
import { cookieOptions } from '../config/config.js';
import asyncHandler from '../utils/asyncHandler.js';
import {
  SUCCESS_MESSAGES,
  successResponse
} from '../utils/responseMessages.js';
import { serializeUser } from '../utils/serializeUser.js';
import { getTokenFromRequest } from '../utils/authToken.js';
import { verifyToken } from '../utils/helper.js';
import User from '../schema/user.model.js';

export const registerUser = asyncHandler(async (req, res, _next) => {
  const { name, email, password } = req.validatedBody;
  const result = await registerUserService(name, email, password);

  if (result.token) {
    res.cookie('token', result.token, cookieOptions);
  }

  const message = result.verificationRequired
    ? 'Account created. Please verify your email before signing in.'
    : SUCCESS_MESSAGES.AUTH.REGISTER_SUCCESS;

  res.status(201).json(
    successResponse(message, {
      user: serializeUser(result.user)
    })
  );
});

export const verifyEmail = asyncHandler(async (req, res, _next) => {
  const { token } = req.validatedBody;
  const { user } = await verifyEmailService(token);
  res.status(200).json(
    successResponse('Email verified successfully', {
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
  const token = getTokenFromRequest(req);
  if (token) {
    try {
      const decoded = await verifyToken(token);
      await User.findByIdAndUpdate(decoded.id, {
        $inc: { tokenVersion: 1 }
      });
    } catch {
      // Invalid or expired token — still clear the cookie.
    }
  }

  res.clearCookie('token', { ...cookieOptions });
  res.status(200).json(successResponse(SUCCESS_MESSAGES.AUTH.LOGOUT_SUCCESS));
});

export const getUserProfile = asyncHandler(async (req, res, _next) => {
  res.status(200).json(
    successResponse('User profile fetched', {
      user: serializeUser(req.user)
    })
  );
});

export const updateUserProfile = asyncHandler(async (req, res, _next) => {
  const { name } = req.validatedBody;
  const { user } = await updateUserProfileService(req.user._id, { name });
  res.status(200).json(
    successResponse(SUCCESS_MESSAGES.USER.PROFILE_UPDATED, {
      user: serializeUser(user)
    })
  );
});

export const deleteAccount = asyncHandler(async (req, res, _next) => {
  await deleteUserAccountService(req.user._id);
  res.clearCookie('token', { ...cookieOptions });
  res.status(200).json(successResponse('Account deleted successfully'));
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
      successResponse(SUCCESS_MESSAGES.USER.PASSWORD_CHANGED, {
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
  await resetPasswordService(token, password);
  res.status(200).json(successResponse('Password reset successfully'));
});
