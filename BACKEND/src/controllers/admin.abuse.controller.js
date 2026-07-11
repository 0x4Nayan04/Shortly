import asyncHandler from '../utils/asyncHandler.js';
import { successResponse } from '../utils/responseMessages.js';
import {
  getAbuseReportService,
  listAbuseReportsService,
  retireAbuseReportLinkService,
  updateAbuseReportService
} from '../services/abuse.service.js';

export const listAbuseReports = asyncHandler(async (req, res) => {
  const { status, limit, skip } = req.validatedQuery;
  const result = await listAbuseReportsService({ status, limit, skip });
  res.json(successResponse('Abuse reports retrieved', result));
});

export const getAbuseReport = asyncHandler(async (req, res) => {
  const { id } = req.validatedParams;
  const result = await getAbuseReportService(id);
  res.json(successResponse('Abuse report retrieved', result));
});

export const updateAbuseReport = asyncHandler(async (req, res) => {
  const { id } = req.validatedParams;
  const { status, reviewNotes } = req.validatedBody;
  const result = await updateAbuseReportService({
    id,
    status,
    reviewNotes,
    adminEmail: req.user.email
  });
  res.json(successResponse('Abuse report updated', result));
});

export const retireAbuseReportLink = asyncHandler(async (req, res) => {
  const { id } = req.validatedParams;
  const result = await retireAbuseReportLinkService({
    id,
    adminEmail: req.user.email
  });
  res.json(successResponse('Short link retired', result));
});
