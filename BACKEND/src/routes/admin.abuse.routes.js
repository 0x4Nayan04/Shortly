import express from 'express';
import {
  getAbuseReport,
  listAbuseReports,
  retireAbuseReportLink,
  updateAbuseReport
} from '../controllers/admin.abuse.controller.js';
import { requireAdmin } from '../middleware/auth.middleware.js';
import {
  validateBody,
  validateParams,
  validateQuery
} from '../middleware/validation.middleware.js';
import {
  adminAbuseListQuerySchema,
  adminAbuseReportParamsSchema,
  adminAbuseUpdateSchema
} from '../validation/schemas.js';

const router = express.Router();

router.use(requireAdmin);

router.get(
  '/reports',
  validateQuery(adminAbuseListQuerySchema),
  listAbuseReports
);

router.get(
  '/reports/:id',
  validateParams(adminAbuseReportParamsSchema),
  getAbuseReport
);

router.patch(
  '/reports/:id',
  validateParams(adminAbuseReportParamsSchema),
  validateBody(adminAbuseUpdateSchema),
  updateAbuseReport
);

router.post(
  '/reports/:id/retire',
  validateParams(adminAbuseReportParamsSchema),
  retireAbuseReportLink
);

export default router;
