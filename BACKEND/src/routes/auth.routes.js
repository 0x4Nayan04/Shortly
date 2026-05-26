import express from "express";
import {
  login_user,
  register_user,
  logout_user,
  get_user_profile,
} from "../controllers/auth.controller.js";
import { isAuthenticated } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validation.middleware.js";
import { registerSchema, loginSchema } from "../validation/schemas.js";
import { rateLimiter, keyGenerators } from "../middleware/rateLimit.middleware.js";

const router = express.Router();

const loginLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: keyGenerators.emailIp,
  failClosed: true,
});

// Public routes
router.post("/register", validateBody(registerSchema), register_user);
router.post("/login", loginLimiter, validateBody(loginSchema), login_user);

// Logout should clear cookie even if token expired
router.post("/logout", logout_user);
// Protected routes (require authentication)
router.get("/me", isAuthenticated, get_user_profile);

export default router;
