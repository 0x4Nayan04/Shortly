import express from 'express';
import {
  createShortUrl,
  createCustomShortUrl,
  getUserUrls,
  deleteShortUrl,
  bulkDeleteUrls,
  getUrlStats
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
  bulkDeleteUrlsSchema
} from '../validation/schemas.js';
import {
  rateLimiter,
  keyGenerators
} from '../middleware/rateLimit.middleware.js';

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

// Public route - creates short URL, no authentication required
router.post('/', createLimiter, validateBody(createUrlSchema), createShortUrl);

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
router.get('/stats', isAuthenticated, getUrlStats);
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
