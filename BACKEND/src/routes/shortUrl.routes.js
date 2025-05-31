import express from "express";
import {
  createShortUrl,
  createCustomShortUrl,
  getUserUrls,
  deleteShortUrl,
} from "../controllers/shortUrl.controllers.js";
import { isAuthenticated } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public route - creates short URL, no authentication required
router.post("/", createShortUrl);

// Protected routes - require authentication
router.post("/custom", isAuthenticated, createCustomShortUrl); // Create custom short URL (requires auth)
router.get("/my-urls", isAuthenticated, getUserUrls); // Get all URLs created by authenticated user
router.delete("/:id", isAuthenticated, deleteShortUrl); // Delete a short URL (requires auth and ownership)

export default router;
