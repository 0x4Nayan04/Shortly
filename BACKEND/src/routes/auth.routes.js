import express from 'express';
import {
  loginUser,
  registerUser,
  logoutUser,
  getUserProfile,
  changePassword,
  requestPasswordReset,
  resetPassword
} from '../controllers/auth.controller.js';
import { isAuthenticated } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validation.middleware.js';
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} from '../validation/schemas.js';
import {
  rateLimiter,
  keyGenerators
} from '../middleware/rateLimit.middleware.js';

const router = express.Router();

const loginLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: keyGenerators.emailIp,
  failClosed: true
});

const registerLimiter = rateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: keyGenerators.ip
});

const forgotPasswordLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 3,
  keyGenerator: keyGenerators.forgotPasswordEmailIp
});

const resetPasswordLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: keyGenerators.ip
});

// Public routes
router.post(
  '/register',
  registerLimiter,
  validateBody(registerSchema),
  registerUser
);
router.post('/login', validateBody(loginSchema), loginLimiter, loginUser);

// Logout should clear cookie even if token expired
router.post('/logout', logoutUser);

// Public password reset routes
router.post(
  '/forgot-password',
  validateBody(forgotPasswordSchema),
  forgotPasswordLimiter,
  requestPasswordReset
);
router.post(
  '/reset-password',
  resetPasswordLimiter,
  validateBody(resetPasswordSchema),
  resetPassword
);

// Protected routes (require authentication)
router.get('/me', isAuthenticated, getUserProfile);
router.post(
  '/change-password',
  isAuthenticated,
  validateBody(changePasswordSchema),
  changePassword
);

export default router;
