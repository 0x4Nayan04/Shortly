import express from "express";
import {
  getUrlAnalytics,
  getDashboardAnalytics,
} from "../controllers/analytics.controller.js";
import { isAuthenticated } from "../middleware/auth.middleware.js";

const router = express.Router();

// All analytics routes require authentication
router.get("/dashboard", isAuthenticated, getDashboardAnalytics);
router.get("/url/:urlId", isAuthenticated, getUrlAnalytics);

export default router;
