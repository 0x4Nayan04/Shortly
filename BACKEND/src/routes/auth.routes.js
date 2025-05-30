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

// GET routes to serve pages (if needed for SSR or direct access)
router.get("/register", (req, res) => {
  res.json({
    success: true,
    message: "Register page",
    form_fields: ["name", "email", "password"],
  });
});

router.get("/login", (req, res) => {
  res.json({
    success: true,
    message: "Login page",
    form_fields: ["email", "password"],
  });
});

// Protected routes (require authentication)
router.post("/logout", isAuthenticated, logout_user);
router.get("/me", isAuthenticated, get_user_profile); // Alternative endpoint for getting user profile

export default router;
