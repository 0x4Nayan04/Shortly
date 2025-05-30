import express from "express";
import {
  createShortUrl,
  createCustomShortUrl,
  getUserUrls,
} from "../controllers/shortUrl.controllers.js";
import {
  optionalAuth,
  isAuthenticated,
} from "../middleware/auth.middleware.js";

const router = express.Router();

// Public route - creates short URL, optionally associates with user if authenticated
router.post("/", optionalAuth, createShortUrl);

// Protected routes - require authentication
router.post("/custom", isAuthenticated, createCustomShortUrl); // Create custom short URL (requires auth)
router.get("/my-urls", isAuthenticated, getUserUrls); // Get all URLs created by authenticated user

export default router;
