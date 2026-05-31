import crypto from 'crypto';
import {
  createUser,
  findUserByEmail,
  findUserById,
  findUserByResetToken,
  findUserByVerificationToken,
  deleteUserById,
  updateUser
} from '../dao/user.dao.js';
import short_urlModel from '../schema/shortUrl.model.js';
import { signToken } from '../utils/helper.js';
import { AppError } from '../utils/errorHandler.js';
import {
  isPasswordResetEmailConfigured,
  sendPasswordResetEmail,
  sendVerificationEmail
} from './email.service.js';
import { logger } from '../utils/logger.js';

const GENERIC_RESET_MESSAGE =
  'If an account with that email exists, a reset link has been sent.';

export const registerUser = async (name, email, password) => {
  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    throw new AppError('User already exists with this email', 409);
  }

  const newUser = await createUser(name, email, password);

  if (isPasswordResetEmailConfigured()) {
    const verificationToken = newUser.generateEmailVerificationToken();
    await newUser.save();

    try {
      await sendVerificationEmail(email, verificationToken);
    } catch (error) {
      await deleteUserById(newUser._id);
      throw error;
    }

    newUser.password = undefined;
    return { user: newUser, verificationRequired: true };
  }

  newUser.isEmailVerified = true;
  await newUser.save();

  const token = await signToken({
    id: newUser._id,
    tokenVersion: newUser.tokenVersion ?? 0
  });

  newUser.password = undefined;
  return { token, user: newUser };
};

export const verifyEmail = async (token) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await findUserByVerificationToken(hashedToken);
  if (!user) {
    throw new AppError('Invalid or expired verification token', 400);
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = null;
  user.emailVerificationExpires = null;
  await user.save();

  user.password = undefined;
  return { user };
};

export const loginUser = async (email, password) => {
  const user = await findUserByEmail(email);

  if (!user) {
    throw new AppError('Invalid Credentials', 401);
  }

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    throw new AppError('Invalid Credentials', 401);
  }

  if (user.isEmailVerified === false) {
    throw new AppError('Please verify your email before logging in.', 403);
  }

  const token = await signToken({
    id: user._id,
    tokenVersion: user.tokenVersion ?? 0
  });

  user.password = undefined;

  return { token, user };
};

export const changePassword = async (userId, oldPassword, newPassword) => {
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

  user.password = undefined;
  return { token, user };
};

export const updateUserProfile = async (userId, { name }) => {
  const user = await updateUser(userId, { name });
  if (!user) {
    throw new AppError('User not found', 404);
  }

  user.password = undefined;
  return { user };
};

export const deleteUserAccount = async (userId) => {
  const user = await findUserById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  await short_urlModel.deleteMany({ user: userId });
  await deleteUserById(userId);
};

export const requestPasswordReset = async (email) => {
  const user = await findUserByEmail(email);
  if (!user) {
    return { message: GENERIC_RESET_MESSAGE };
  }

  if (!isPasswordResetEmailConfigured()) {
    logger.warn(
      'Password reset requested but email service is not configured',
      {
        email
      }
    );
    return { message: GENERIC_RESET_MESSAGE };
  }

  const resetToken = user.generateResetToken();
  await user.save();

  try {
    await sendPasswordResetEmail(email, resetToken);
  } catch (error) {
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();
    throw error;
  }

  return { message: GENERIC_RESET_MESSAGE };
};

export const resetPassword = async (token, newPassword) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await findUserByResetToken(hashedToken);
  if (!user) {
    throw new AppError('Invalid or expired reset token', 400);
  }

  user.password = newPassword;
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  user.tokenVersion = (user.tokenVersion ?? 0) + 1;
  await user.save();

  user.password = undefined;
  return { user };
};
