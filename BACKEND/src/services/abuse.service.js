import {
  createAbuseReport,
  findAbuseReportById,
  listAbuseReports,
  updateAbuseReportById
} from '../dao/abuseReport.dao.js';
import { findLinkBySlug, retireById } from '../dao/shortUrl.dao.js';
import { notifyOperatorOfAbuseReport } from './email.service.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/errorHandler.js';

const GENERIC_ABUSE_ACK =
  'Thank you. Your report has been received and will be reviewed.';

export const submitAbuseReportService = async ({
  slug,
  reason,
  reporterEmail
}) => {
  const link = await findLinkBySlug(slug);

  const report = await createAbuseReport({
    slug,
    reason,
    reporterEmail,
    shortUrlId: link?._id,
    linkFound: Boolean(link),
    linkRetiredAtSubmit: Boolean(link?.retiredAt)
  });

  try {
    await notifyOperatorOfAbuseReport({ report, link });
  } catch (error) {
    logger.error('Failed to notify operator of abuse report', {
      error: error.message,
      slug,
      reportId: report._id.toString()
    });
  }

  return { message: GENERIC_ABUSE_ACK };
};

export const listAbuseReportsService = async ({ status, limit, skip }) => {
  const { reports, total } = await listAbuseReports({ status, limit, skip });
  return {
    reports,
    pagination: {
      total,
      limit,
      skip,
      page: Math.floor(skip / limit) + 1,
      totalPages: Math.max(1, Math.ceil(total / limit))
    }
  };
};

export const getAbuseReportService = async (id) => {
  const report = await findAbuseReportById(id);
  if (!report) {
    throw new AppError('Abuse report not found', 404);
  }

  let link = null;
  if (report.shortUrlId) {
    link = await findLinkBySlug(report.slug);
  }

  return { report, link };
};

export const updateAbuseReportService = async ({
  id,
  status,
  reviewNotes,
  adminEmail
}) => {
  const report = await findAbuseReportById(id);
  if (!report) {
    throw new AppError('Abuse report not found', 404);
  }

  const updates = {};
  if (status !== undefined) {
    updates.status = status;
    if (status === 'resolved' || status === 'dismissed') {
      updates.resolvedAt = new Date();
      updates.resolvedByEmail = adminEmail;
    }
  }
  if (reviewNotes !== undefined) {
    updates.reviewNotes = reviewNotes || null;
  }

  const updated = await updateAbuseReportById(id, updates);
  return { report: updated };
};

export const retireAbuseReportLinkService = async ({ id, adminEmail }) => {
  const report = await findAbuseReportById(id);
  if (!report) {
    throw new AppError('Abuse report not found', 404);
  }

  const link = await findLinkBySlug(report.slug);
  if (!link) {
    throw new AppError('Linked short URL not found', 404);
  }

  if (!link.retiredAt) {
    const result = await retireById(link._id);
    if (result.modifiedCount === 0) {
      throw new AppError('Failed to retire short link', 500);
    }
  }

  const updated = await updateAbuseReportById(id, {
    status: 'resolved',
    resolvedAt: new Date(),
    resolvedByEmail: adminEmail,
    linkRetiredAtSubmit: true
  });

  return { report: updated, slug: report.slug, retired: true };
};
