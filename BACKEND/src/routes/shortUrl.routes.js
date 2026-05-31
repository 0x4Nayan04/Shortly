import express from 'express';
import {
  createShortUrl,
  createCustomShortUrl,
  getUserUrls,
  deleteShortUrl,
  bulkDeleteUrls,
  getUrlStats,
  updateShortUrl,
  claimAnonymousShortUrls,
  deleteAnonymousShortUrl
} from '../controllers/shortUrl.controllers.js';
import { isAuthenticated } from '../middleware/auth.middleware.js';
import {
  validateBody,
  validateParams,
  validateQuery
} from '../middleware/validation.middleware.js';
import {
  createUrlSchema,
  createCustomUrlSchema,
  deleteUrlSchema,
  getUserUrlsQuerySchema,
  bulkDeleteUrlsSchema,
  updateUrlSchema,
  claimAnonymousLinksSchema,
  deleteAnonymousUrlSchema
} from '../validation/schemas.js';
import {
  rateLimiter,
  keyGenerators
} from '../middleware/rateLimit.middleware.js';
import { loadUserIfAuthenticated } from '../utils/attachUser.js';

const router = express.Router();

const createLimiterAnon = rateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 10,
  keyGenerator: keyGenerators.ipPerEndpoint('create')
});

const createLimiterAuth = rateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 100,
  keyGenerator: keyGenerators.userId
});

const createLimiter = (req, res, next) => {
  const limiter = req.user ? createLimiterAuth : createLimiterAnon;
  return limiter(req, res, next);
};

const statsLimiter = rateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: keyGenerators.userId,
  failClosed: false
});

// Public route - creates short URL, no authentication required
router.post(
  '/',
  loadUserIfAuthenticated,
  createLimiter,
  validateBody(createUrlSchema),
  createShortUrl
);

// Protected routes - require authentication
router.post(
  '/custom',
  isAuthenticated,
  createLimiterAuth,
  validateBody(createCustomUrlSchema),
  createCustomShortUrl
);
router.get(
  '/my-urls',
  isAuthenticated,
  validateQuery(getUserUrlsQuerySchema),
  getUserUrls
);
router.get('/stats', isAuthenticated, statsLimiter, getUrlStats);
router.post(
  '/claim',
  isAuthenticated,
  validateBody(claimAnonymousLinksSchema),
  claimAnonymousShortUrls
);
router.patch(
  '/:id',
  isAuthenticated,
  validateParams(deleteUrlSchema),
  validateBody(updateUrlSchema),
  updateShortUrl
);
router.delete(
  '/anonymous/:id',
  validateParams(deleteUrlSchema),
  validateBody(deleteAnonymousUrlSchema),
  deleteAnonymousShortUrl
);
router.delete(
  '/bulk',
  isAuthenticated,
  validateBody(bulkDeleteUrlsSchema),
  bulkDeleteUrls
);
router.delete(
  '/:id',
  isAuthenticated,
  validateParams(deleteUrlSchema),
  deleteShortUrl
);

export default router;
