import {
  create as createUser,
  findByEmail as findUserByEmail,
  findByIdAndDelete as findUserByIdAndDelete,
  findByVerificationToken,
  incrementTokenVersionById
} from '../dao/user.dao.js';
import { signToken, verifyToken } from '../utils/helper.js';
import { AppError } from '../utils/errorHandler.js';
import {
  dispatchVerificationForUser,
  isEmailServiceConfigured
} from './email.service.js';
import { alertEmailDeliveryFailure } from './opsAlert.service.js';
import { logger } from '../utils/logger.js';
import { CURRENT_TERMS_VERSION } from '../constants/terms.js';
import bcrypt from 'bcrypt';

const GENERIC_RESEND_VERIFICATION_MESSAGE =
  'If your account needs verification, a new link has been sent.';

export const registerUserService = async ({ name, email, password }) => {
  const existing = await findUserByEmail(email);
  if (existing) {
    await bcrypt.hash(password, 12);
    return { accepted: true };
  }

  let newUser;
  try {
    newUser = await createUser({
      name,
      email,
      password,
      acceptedTermsAt: new Date(),
      termsVersion: CURRENT_TERMS_VERSION
    });
  } catch (error) {
    if (error.code === 11000) return { accepted: true };
    throw error;
  }

  if (!isEmailServiceConfigured()) {
    newUser.isEmailVerified = true;
    await newUser.save();
    return { accepted: true };
  }

  try {
    await dispatchVerificationForUser(newUser);
    return { accepted: true };
  } catch (error) {
    await findUserByIdAndDelete(newUser._id);
    throw error;
  }
};

export const resendVerificationEmailService = async ({ email }) => {
  const user = await findUserByEmail(email);

  if (!user || user.isEmailVerified !== false) {
    return { message: GENERIC_RESEND_VERIFICATION_MESSAGE };
  }

  if (!isEmailServiceConfigured()) {
    logger.warn(
      'Verification resend requested but email service is not configured',
      { email }
    );
    return { message: GENERIC_RESEND_VERIFICATION_MESSAGE };
  }

  try {
    await dispatchVerificationForUser(user);
  } catch (error) {
    logger.error('Failed to dispatch verification email', {
      error: error.message,
      email
    });
    await alertEmailDeliveryFailure({
      emailType: 'verification',
      recipient: email,
      error
    });
  }

  return { message: GENERIC_RESEND_VERIFICATION_MESSAGE };
};

export const verifyEmailService = async ({ token }) => {
  const user = await findByVerificationToken(token);
  if (!user) {
    throw new AppError('Invalid or expired verification token', 400);
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = null;
  user.emailVerificationExpires = null;
  await user.save();

  return { user };
};

export const loginUserService = async ({ email, password }) => {
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

  return { token, user };
};

export const logoutUserService = async ({ token }) => {
  if (!token) return;

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch {
    return;
  }
  if (!decoded?.id) return;

  await incrementTokenVersionById(decoded.id);
};
