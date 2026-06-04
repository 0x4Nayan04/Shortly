import {
  findById as findUserById,
  findByIdAndDelete as findUserByIdAndDelete,
  findByEmail as findUserByEmail,
  findByResetToken,
  updateNameById
} from '../dao/user.dao.js';
import { deleteAllForUser } from '../dao/shortUrl.dao.js';
import { signToken } from '../utils/helper.js';
import { AppError } from '../utils/errorHandler.js';
import {
  dispatchPasswordResetForUser,
  isEmailServiceConfigured
} from './email.service.js';
import { logger } from '../utils/logger.js';

const GENERIC_RESET_MESSAGE =
  'If an account with that email exists, a reset link has been sent.';

export const changePassword = async ({ userId, oldPassword, newPassword }) => {
  const user = await findUserById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const isMatch = await user.comparePassword(oldPassword);
  if (!isMatch) {
    throw new AppError('Old password is incorrect', 401);
  }

  const sameAsOld = await user.comparePassword(newPassword);
  if (sameAsOld) {
    throw new AppError('New password must be different from old password', 400);
  }

  user.password = newPassword;
  user.tokenVersion = (user.tokenVersion ?? 0) + 1;
  await user.save();

  const token = await signToken({
    id: user._id,
    tokenVersion: user.tokenVersion ?? 0
  });

  return { token, user };
};

export const updateProfile = async ({ userId, name }) => {
  const user = await updateNameById(userId, name);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  return { user };
};

export const deleteAccount = async ({ userId }) => {
  const user = await findUserById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  await deleteAllForUser(userId);
  await findUserByIdAndDelete(userId);
};

export const requestPasswordReset = async ({ email }) => {
  const user = await findUserByEmail(email);
  if (!user) {
    return { message: GENERIC_RESET_MESSAGE };
  }

  if (!isEmailServiceConfigured()) {
    logger.warn(
      'Password reset requested but email service is not configured',
      { email }
    );
    return { message: GENERIC_RESET_MESSAGE };
  }

  try {
    await dispatchPasswordResetForUser(user);
  } catch (error) {
    logger.error('Failed to dispatch password reset email', {
      error: error.message,
      email
    });
  }

  return { message: GENERIC_RESET_MESSAGE };
};

export const resetPassword = async ({ token, newPassword }) => {
  const user = await findByResetToken(token);
  if (!user) {
    throw new AppError('Invalid or expired reset token', 400);
  }

  user.password = newPassword;
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  user.tokenVersion = (user.tokenVersion ?? 0) + 1;
  await user.save();

  return { user };
};
