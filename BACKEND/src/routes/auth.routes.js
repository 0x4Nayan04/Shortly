import express from 'express';
import {
  loginUser,
  registerUser,
  logoutUser,
  getUserProfile,
  changePassword,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
  resendVerificationEmail,
  updateUserProfile,
  deleteAccount
} from '../controllers/auth.controller.js';
import {
  isAuthenticated,
  optionalAuthenticate
} from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validation.middleware.js';
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  updateProfileSchema,
  deleteAccountSchema
} from '../validation/schemas.js';
import {
  rateLimiter,
  keyGenerators
} from '../middleware/rateLimit.middleware.js';

const router = express.Router();

const loginAccountLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: keyGenerators.loginAccount,
  failClosed: true
});

const loginIpLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  keyGenerator: keyGenerators.loginIp,
  failClosed: true
});

const registerLimiter = rateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: keyGenerators.ip
});

const recoveryAccountLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 3,
  keyGenerator: keyGenerators.recoveryAccount
});

const recoveryIpLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 15,
  keyGenerator: keyGenerators.recoveryIp
});

const resetPasswordLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: keyGenerators.ip
});

const verifyEmailLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: keyGenerators.ip
});

const meLimiter = rateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: keyGenerators.userId,
  failClosed: false
});

router.post(
  '/register',
  registerLimiter,
  validateBody(registerSchema),
  registerUser
);
router.post(
  '/login',
  loginIpLimiter,
  loginAccountLimiter,
  validateBody(loginSchema),
  loginUser
);
router.post(
  '/verify-email',
  verifyEmailLimiter,
  validateBody(verifyEmailSchema),
  verifyEmail
);
router.post(
  '/resend-verification',
  recoveryIpLimiter,
  recoveryAccountLimiter,
  validateBody(forgotPasswordSchema),
  resendVerificationEmail
);

router.post('/logout', logoutUser);

router.post(
  '/forgot-password',
  recoveryIpLimiter,
  recoveryAccountLimiter,
  validateBody(forgotPasswordSchema),
  requestPasswordReset
);
router.post(
  '/reset-password',
  resetPasswordLimiter,
  validateBody(resetPasswordSchema),
  resetPassword
);

router.get('/me', optionalAuthenticate, meLimiter, getUserProfile);
router.patch(
  '/me',
  isAuthenticated,
  validateBody(updateProfileSchema),
  updateUserProfile
);
router.delete(
  '/me',
  isAuthenticated,
  validateBody(deleteAccountSchema),
  deleteAccount
);
router.post(
  '/change-password',
  isAuthenticated,
  validateBody(changePasswordSchema),
  changePassword
);

export default router;
