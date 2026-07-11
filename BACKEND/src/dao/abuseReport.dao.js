import AbuseReport from '../schema/abuseReport.model.js';

export const createAbuseReport = async ({
  slug,
  reason,
  reporterEmail,
  shortUrlId,
  linkFound,
  linkRetiredAtSubmit
}) => {
  const report = new AbuseReport({
    slug,
    reason,
    reporterEmail: reporterEmail || null,
    shortUrlId: shortUrlId || null,
    linkFound,
    linkRetiredAtSubmit
  });
  await report.save();
  return report;
};

export const listAbuseReports = async ({
  status,
  limit = 20,
  skip = 0
} = {}) => {
  const query = {};
  if (status) query.status = status;

  const [reports, total] = await Promise.all([
    AbuseReport.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AbuseReport.countDocuments(query)
  ]);

  return { reports, total };
};

export const findAbuseReportById = async (id) =>
  AbuseReport.findById(id).lean();

export const updateAbuseReportById = async (id, updates) =>
  AbuseReport.findByIdAndUpdate(
    id,
    { $set: updates },
    { new: true, runValidators: true }
  ).lean();
