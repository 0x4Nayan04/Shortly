import express from "express";
import {
  createShortUrl,
  createCustomShortUrl,
  getUserUrls,
  deleteShortUrl,
  bulkDeleteUrls,
  getUrlStats,
} from "../controllers/shortUrl.controllers.js";
import { isAuthenticated } from "../middleware/auth.middleware.js";
import { validateBody, validateParams, validateQuery } from "../middleware/validation.middleware.js";
import {
  createUrlSchema,
  createCustomUrlSchema,
  deleteUrlSchema,
  getUserUrlsQuerySchema,
  bulkDeleteUrlsSchema,
} from "../validation/schemas.js";

const router = express.Router();

// Public route - creates short URL, no authentication required
router.post("/", validateBody(createUrlSchema), createShortUrl);

// Protected routes - require authentication
router.post("/custom", isAuthenticated, validateBody(createCustomUrlSchema), createCustomShortUrl); // Create custom short URL (requires auth)
router.get("/my-urls", isAuthenticated, validateQuery(getUserUrlsQuerySchema), getUserUrls); // Get all URLs created by authenticated user
router.get("/stats", isAuthenticated, getUrlStats); // Get URL statistics for authenticated user
router.delete("/bulk", isAuthenticated, validateBody(bulkDeleteUrlsSchema), bulkDeleteUrls); // Bulk delete URLs (requires auth)
router.delete("/:id", isAuthenticated, validateParams(deleteUrlSchema), deleteShortUrl); // Delete a short URL (requires auth and ownership)

export default router;
