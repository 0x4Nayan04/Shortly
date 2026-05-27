import express from 'express';
import {
  login_user,
  register_user,
  logout_user,
  get_user_profile,
  change_password,
  request_password_reset,
  reset_password
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
  register_user
);
router.post('/login', loginLimiter, validateBody(loginSchema), login_user);

// Logout should clear cookie even if token expired
router.post('/logout', logout_user);

// Public password reset routes
router.post(
  '/forgot-password',
  forgotPasswordLimiter,
  validateBody(forgotPasswordSchema),
  request_password_reset
);
router.post(
  '/reset-password',
  resetPasswordLimiter,
  validateBody(resetPasswordSchema),
  reset_password
);

// Protected routes (require authentication)
router.get('/me', isAuthenticated, get_user_profile);
router.post(
  '/change-password',
  isAuthenticated,
  validateBody(changePasswordSchema),
  change_password
);

export default router;
