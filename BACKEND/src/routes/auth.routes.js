import express from "express";
import {
  login_user,
  register_user,
  logout_user,
  get_user_profile,
} from "../controllers/auth.controller.js";
import { isAuthenticated } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public routes
router.post("/register", register_user);
router.post("/login", login_user);

// Protected routes (require authentication)
router.post("/logout", isAuthenticated, logout_user);
router.get("/profile", isAuthenticated, get_user_profile);
router.get("/me", isAuthenticated, get_user_profile); // Alternative endpoint for getting user profile

export default router;
