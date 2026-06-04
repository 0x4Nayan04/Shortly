import short_urlModel from '../schema/shortUrl.model.js';
import { SLUG_RECLAIM_DAYS } from '../constants/shortUrlLimits.js';
import { normalizeSlug } from '../utils/normalizeSlug.js';
import { escapeRegExp } from '../utils/escapeRegExp.js';

export const ACTIVE_LINK_FILTER = { deletedAt: null };

const ACTIVE_AND_ENABLED_FILTER = {
  ...ACTIVE_LINK_FILTER,
  disabled: { $ne: true }
};

const projectionShortUrlFull = '_id short_url full_url canonical_url click disabled createdAt manage_token';
const projectionForRedirect = '_id full_url';

const reclaimMs = () => SLUG_RECLAIM_DAYS * 24 * 60 * 60 * 1000;

export const saveShortUrl = async ({
  short_url,
  full_url,
  canonical_url,
  userId,
  manage_token = null
}) => {
  const slug = normalizeSlug(short_url);
  const doc = {
    full_url,
    canonical_url,
    short_url: slug,
    click: 0,
    disabled: false,
    deletedAt: null
  };

  if (userId) {
    doc.user = userId;
  }

  if (manage_token) {
    doc.manage_token = manage_token;
  }

  const created = await short_urlModel.create(doc);
  return { short_url: slug, id: created._id.toString() };
};

export const isSlugAvailable = async (short_url) => {
  const slug = normalizeSlug(short_url);
  const existing = await short_urlModel
    .findOne({ short_url: slug })
    .select('deletedAt')
    .lean();

  if (!existing) return true;
  if (!existing.deletedAt) return false;

  return Date.now() - new Date(existing.deletedAt).getTime() >= reclaimMs();
};

export const purgeReclaimableSlug = async (short_url) => {
  const slug = normalizeSlug(short_url);
  const existing = await short_urlModel
    .findOne({ short_url: slug })
    .select('deletedAt')
    .lean();

  if (!existing?.deletedAt) return;

  if (Date.now() - new Date(existing.deletedAt).getTime() < reclaimMs()) {
    return;
  }

  await short_urlModel.deleteOne({ _id: existing._id });
};

export const countActiveLinksForUser = async (userId) =>
  short_urlModel.countDocuments({ user: userId, ...ACTIVE_LINK_FILTER });

export const findActiveLinkBySlug = async (short_url) => {
  const slug = normalizeSlug(short_url);
  return short_urlModel
    .findOne({ short_url: slug, ...ACTIVE_AND_ENABLED_FILTER })
    .select(projectionForRedirect)
    .lean();
};

export const findOwnedActiveById = async (id, userId) =>
  short_urlModel
    .findOne({ _id: id, user: userId, ...ACTIVE_LINK_FILTER })
    .select(projectionShortUrlFull)
    .lean();

export const findExistingForCanonical = async (canonical_url, userId) => {
  const query = userId
    ? { canonical_url, user: userId, ...ACTIVE_LINK_FILTER }
    : { canonical_url, user: null, ...ACTIVE_LINK_FILTER };
  return short_urlModel
    .findOne(query)
    .sort({ createdAt: 1 })
    .select('_id short_url manage_token')
    .lean();
};

export const findAnonymousByIdAndToken = async (id, manage_token) =>
  short_urlModel
    .findOne({
      _id: id,
      user: null,
      ...ACTIVE_LINK_FILTER,
      manage_token
    })
    .select('_id short_url canonical_url')
    .lean();

export const findOwnedDuplicateByCanonical = async (userId, canonical_url) =>
  short_urlModel.exists({
    user: userId,
    canonical_url,
    ...ACTIVE_LINK_FILTER
  });

export const listForUser = async ({
  userId,
  skip = 0,
  limit = 20,
  search,
  sortBy = 'createdAt',
  sortOrder = -1
}) => {
  const baseQuery = { user: userId, ...ACTIVE_LINK_FILTER };

  if (search && search.trim()) {
    const searchRegex = new RegExp(escapeRegExp(search.trim()), 'i');
    baseQuery.$or = [{ full_url: searchRegex }, { short_url: searchRegex }];
  }

  const sortOptions = { [sortBy]: sortOrder };

  const [urls, totalCount] = await Promise.all([
    short_urlModel
      .find(baseQuery)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .select('full_url short_url click createdAt disabled')
      .lean(),
    short_urlModel.countDocuments(baseQuery)
  ]);

  return { urls, totalCount };
};

export const findTopClickedForUser = async (userId, limit = 5) =>
  short_urlModel
    .find({ user: userId, ...ACTIVE_LINK_FILTER })
    .sort({ click: -1 })
    .limit(limit)
    .select('full_url short_url click createdAt')
    .lean();

export const aggregateLifetimeStatsForUser = async (userId) => {
  const [result] = await short_urlModel.aggregate([
    { $match: { user: userId, ...ACTIVE_LINK_FILTER } },
    {
      $group: {
        _id: null,
        totalUrls: { $sum: 1 },
        totalClicksLifetime: { $sum: '$click' },
        avgClicks: { $avg: '$click' }
      }
    }
  ]);
  return result || { totalUrls: 0, totalClicksLifetime: 0, avgClicks: 0 };
};

export const aggregateRecentActivityForUser = async (userId, since) =>
  short_urlModel.aggregate([
    { $match: { user: userId, ...ACTIVE_LINK_FILTER } },
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
        clicks: { $sum: '$click' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

export const updateByIdAndUser = async (id, userId, patch) => {
  await short_urlModel.updateOne({ _id: id, user: userId }, { $set: patch });
  return short_urlModel
    .findOne({ _id: id, user: userId })
    .select(projectionShortUrlFull)
    .lean();
};

export const softDeleteByIdAndUser = async (id, userId) => {
  const result = await short_urlModel.updateOne(
    { _id: id, user: userId, ...ACTIVE_LINK_FILTER },
    { $set: { deletedAt: new Date() } }
  );
  return result.modifiedCount > 0;
};

export const findOwnedActiveByIds = async (ids, userId) =>
  short_urlModel
    .find({ _id: { $in: ids }, user: userId, ...ACTIVE_LINK_FILTER })
    .select('_id short_url')
    .lean();

export const softDeleteManyByIdsAndUser = async (ids, userId) => {
  const result = await short_urlModel.updateMany(
    { _id: { $in: ids }, user: userId, ...ACTIVE_LINK_FILTER },
    { $set: { deletedAt: new Date() } }
  );
  return result.modifiedCount;
};

export const incrementClick = async (id, session) =>
  short_urlModel.updateOne(
    { _id: id },
    { $inc: { click: 1 } },
    { session }
  );

export const claimAnonymousLink = async (id, userId) =>
  short_urlModel.updateOne(
    { _id: id },
    { $set: { user: userId }, $unset: { manage_token: 1 } }
  );

export const softDeleteById = async (id) =>
  short_urlModel.updateOne(
    { _id: id },
    { $set: { deletedAt: new Date() } }
  );

export const deleteAllForUser = async (userId) =>
  short_urlModel.deleteMany({ user: userId });
