import short_urlModel from '../schema/shortUrl.model.js';
import { normalizeSlug } from '../utils/normalizeSlug.js';
import { escapeRegExp } from '../utils/escapeRegExp.js';

const ACTIVE_LINK_FILTER = { retiredAt: null };

const projectionShortUrlFull =
  '_id short_url full_url canonical_url click disabled createdAt manage_token';
const projectionForRedirect = '_id full_url retiredAt disabled';

const tombstoneUpdate = (retiredAt = new Date()) => ({
  $set: { retiredAt, disabled: true, click: 0 },
  $unset: {
    full_url: 1,
    canonical_url: 1,
    user: 1,
    manage_token: 1,
    claim_recovery_token: 1,
    claim_recovery_expires: 1
  }
});

export const saveShortUrl = async ({
  short_url,
  full_url,
  canonical_url,
  userId,
  manage_token = null,
  session = null
}) => {
  const slug = normalizeSlug(short_url);
  const doc = {
    full_url,
    canonical_url,
    short_url: slug,
    click: 0,
    disabled: false,
    retiredAt: null
  };

  if (userId) {
    doc.user = userId;
  }

  if (manage_token) {
    doc.manage_token = manage_token;
  }

  const created = session
    ? (await short_urlModel.create([doc], { session }))[0]
    : await short_urlModel.create(doc);
  return { short_url: slug, id: created._id.toString() };
};

export const isSlugAvailable = async (short_url) => {
  const slug = normalizeSlug(short_url);
  return !(await short_urlModel.exists({ short_url: slug }));
};

export const countActiveLinksForUser = async (userId) =>
  short_urlModel.countDocuments({ user: userId, ...ACTIVE_LINK_FILTER });

export const findLinkBySlug = async (short_url) => {
  const slug = normalizeSlug(short_url);
  return short_urlModel
    .findOne({ short_url: slug })
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

export const setAnonymousClaimRecoveryToken = async (
  id,
  manage_token,
  claim_recovery_token,
  claim_recovery_expires
) =>
  short_urlModel.updateOne(
    { _id: id, user: null, manage_token, ...ACTIVE_LINK_FILTER },
    { $set: { claim_recovery_token, claim_recovery_expires } }
  );

export const clearAnonymousClaimRecoveryToken = async (
  id,
  claim_recovery_token
) =>
  short_urlModel.updateOne(
    { _id: id, user: null, claim_recovery_token, ...ACTIVE_LINK_FILTER },
    { $unset: { claim_recovery_token: 1, claim_recovery_expires: 1 } }
  );

export const findAnonymousByRecoveryToken = async (
  claim_recovery_token,
  now = new Date()
) =>
  short_urlModel
    .findOne({
      user: null,
      claim_recovery_token,
      claim_recovery_expires: { $gt: now },
      ...ACTIVE_LINK_FILTER
    })
    .select('_id short_url canonical_url')
    .lean();

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
  await short_urlModel.updateOne(
    { _id: id, user: userId, ...ACTIVE_LINK_FILTER },
    { $set: patch }
  );
  return short_urlModel
    .findOne({ _id: id, user: userId, ...ACTIVE_LINK_FILTER })
    .select(projectionShortUrlFull)
    .lean();
};

export const retireByIdAndUser = async (id, userId, session = null) => {
  const result = await short_urlModel.updateOne(
    { _id: id, user: userId, ...ACTIVE_LINK_FILTER },
    tombstoneUpdate(),
    session ? { session } : undefined
  );
  return result.modifiedCount > 0;
};

export const findOwnedActiveByIds = async (ids, userId) =>
  short_urlModel
    .find({ _id: { $in: ids }, user: userId, ...ACTIVE_LINK_FILTER })
    .select('_id short_url')
    .lean();

export const retireManyByIdsAndUser = async (ids, userId, session = null) => {
  const result = await short_urlModel.updateMany(
    { _id: { $in: ids }, user: userId, ...ACTIVE_LINK_FILTER },
    tombstoneUpdate(),
    session ? { session } : undefined
  );
  return result.modifiedCount;
};

export const incrementClick = async (id, session) =>
  short_urlModel.updateOne(
    { _id: id, ...ACTIVE_LINK_FILTER },
    { $inc: { click: 1 } },
    { session }
  );

export const claimAnonymousLink = async (id, manage_token, userId, session) =>
  short_urlModel
    .findOneAndUpdate(
      { _id: id, user: null, manage_token, ...ACTIVE_LINK_FILTER },
      { $set: { user: userId }, $unset: { manage_token: 1 } },
      {
        session,
        new: true,
        projection: { _id: 1, short_url: 1, canonical_url: 1 }
      }
    )
    .lean();

export const claimAnonymousLinkByRecoveryToken = async (
  id,
  claim_recovery_token,
  userId,
  session,
  now = new Date()
) =>
  short_urlModel
    .findOneAndUpdate(
      {
        _id: id,
        user: null,
        claim_recovery_token,
        claim_recovery_expires: { $gt: now },
        ...ACTIVE_LINK_FILTER
      },
      {
        $set: { user: userId },
        $unset: {
          manage_token: 1,
          claim_recovery_token: 1,
          claim_recovery_expires: 1
        }
      },
      {
        session,
        new: true,
        projection: { _id: 1, short_url: 1, canonical_url: 1 }
      }
    )
    .lean();

export const retireAnonymousByToken = async (id, manage_token) =>
  short_urlModel.updateOne(
    { _id: id, user: null, manage_token, ...ACTIVE_LINK_FILTER },
    tombstoneUpdate()
  );

export const retireById = async (id, session = null) =>
  short_urlModel.updateOne(
    { _id: id, ...ACTIVE_LINK_FILTER },
    tombstoneUpdate(),
    session ? { session } : undefined
  );

export const retireAllForUser = async (userId, session = null) =>
  short_urlModel.updateMany(
    { user: userId, ...ACTIVE_LINK_FILTER },
    tombstoneUpdate(),
    session ? { session } : undefined
  );
