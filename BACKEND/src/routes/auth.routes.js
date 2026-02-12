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

const router = express.Router();

// Public routes
router.post("/register", validateBody(registerSchema), register_user);
router.post("/login", validateBody(loginSchema), login_user);

// Protected routes (require authentication)
router.post("/logout", isAuthenticated, logout_user);
router.get("/me", isAuthenticated, get_user_profile);

export default router;
