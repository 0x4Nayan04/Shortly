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
  emailAnonymousClaimRecovery,
  redeemAnonymousClaimRecovery
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
  emailAnonymousClaimRecoverySchema,
  redeemAnonymousClaimRecoverySchema
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

const claimLimiter = rateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 30,
  keyGenerator: keyGenerators.userId
});

const emailClaimLimiter = rateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: keyGenerators.ipPerEndpoint('email-claim')
});

router.post(
  '/',
  loadUserIfAuthenticated,
  createLimiter,
  validateBody(createUrlSchema),
  createShortUrl
);

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
  claimLimiter,
  validateBody(claimAnonymousLinksSchema),
  claimAnonymousShortUrls
);
router.post(
  '/claim/email',
  emailClaimLimiter,
  validateBody(emailAnonymousClaimRecoverySchema),
  emailAnonymousClaimRecovery
);
router.post(
  '/claim/redeem',
  isAuthenticated,
  claimLimiter,
  validateBody(redeemAnonymousClaimRecoverySchema),
  redeemAnonymousClaimRecovery
);
router.patch(
  '/:id',
  isAuthenticated,
  validateParams(deleteUrlSchema),
  validateBody(updateUrlSchema),
  updateShortUrl
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
