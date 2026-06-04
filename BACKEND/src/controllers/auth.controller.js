import { cookieOptions } from '../config/config.js';
import asyncHandler from '../utils/asyncHandler.js';
import {
  successResponse,
  SUCCESS_MESSAGES
} from '../utils/responseMessages.js';
import { serializeUser } from '../utils/serializeUser.js';
import { getTokenFromRequest } from '../utils/authToken.js';
import {
  registerUser as registerUserService,
  loginUser as loginUserService,
  verifyEmail as verifyEmailService,
  resendVerificationEmail as resendVerificationEmailService,
  logoutUser as logoutUserService
} from '../services/auth.service.js';
import {
  changePassword as changePasswordService,
  updateProfile as updateProfileService,
  deleteAccount as deleteAccountService,
  requestPasswordReset as requestPasswordResetService,
  resetPassword as resetPasswordService
} from '../services/account.service.js';

export const registerUser = asyncHandler(async (req, res, _next) => {
  const { name, email, password } = req.validatedBody;
  const result = await registerUserService({ name, email, password });

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
  const { user } = await verifyEmailService({ token });
  res.status(200).json(
    successResponse('Email verified successfully', {
      user: serializeUser(user)
    })
  );
});

export const resendVerificationEmail = asyncHandler(async (req, res, _next) => {
  const { email } = req.validatedBody;
  const result = await resendVerificationEmailService({ email });
  res.status(200).json(successResponse(result.message));
});

export const loginUser = asyncHandler(async (req, res, _next) => {
  const { email, password } = req.validatedBody;
  const { token, user } = await loginUserService({ email, password });

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
  await logoutUserService({ token });

  res.clearCookie('token', { ...cookieOptions });
  res.status(200).json(successResponse(SUCCESS_MESSAGES.AUTH.LOGOUT_SUCCESS));
});

export const getUserProfile = asyncHandler(async (req, res, _next) => {
  res.status(200).json(
    successResponse('User profile fetched', {
      user: req.user ? serializeUser(req.user) : null
    })
  );
});

export const updateUserProfile = asyncHandler(async (req, res, _next) => {
  const { name } = req.validatedBody;
  const { user } = await updateProfileService({ userId: req.user._id, name });
  res.status(200).json(
    successResponse(SUCCESS_MESSAGES.USER.PROFILE_UPDATED, {
      user: serializeUser(user)
    })
  );
});

export const deleteAccount = asyncHandler(async (req, res, _next) => {
  await deleteAccountService({ userId: req.user._id });
  res.clearCookie('token', { ...cookieOptions });
  res.status(200).json(successResponse('Account deleted successfully'));
});

export const changePassword = asyncHandler(async (req, res, _next) => {
  const { oldPassword, newPassword } = req.validatedBody;
  const { token, user } = await changePasswordService({
    userId: req.user._id,
    oldPassword,
    newPassword
  });
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
  const result = await requestPasswordResetService({ email });
  res.status(200).json(successResponse(result.message));
});

export const resetPassword = asyncHandler(async (req, res, _next) => {
  const { token, password } = req.validatedBody;
  await resetPasswordService({ token, newPassword: password });
  res.status(200).json(successResponse('Password reset successfully'));
});
