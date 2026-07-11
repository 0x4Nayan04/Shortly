import express from 'express';
import { submitAbuseReport } from '../controllers/abuse.controller.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { abuseReportSchema } from '../validation/schemas.js';
import {
  rateLimiter,
  keyGenerators
} from '../middleware/rateLimit.middleware.js';

const router = express.Router();

const abuseReportLimiter = rateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyGenerator: keyGenerators.ip
});

router.post(
  '/report',
  abuseReportLimiter,
  validateBody(abuseReportSchema),
  submitAbuseReport
);

export default router;
