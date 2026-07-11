import asyncHandler from '../utils/asyncHandler.js';
import { successResponse } from '../utils/responseMessages.js';
import { submitAbuseReportService } from '../services/abuse.service.js';

export const submitAbuseReport = asyncHandler(async (req, res) => {
  const { slug, reason, reporterEmail } = req.validatedBody;
  const result = await submitAbuseReportService({
    slug,
    reason,
    reporterEmail
  });
  res.status(202).json(successResponse(result.message, { accepted: true }));
});
