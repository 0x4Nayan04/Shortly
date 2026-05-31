import short_urlModel from '../schema/shortUrl.model.js';
import Click from '../schema/click.model.js';
import { logger } from '../utils/logger.js';
import { normalizeUrl } from '../utils/normalizeUrl.js';

/**
 * Normalize anonymous links: missing `user` field → explicit null.
 */
export const backfillAnonymousShortUrlUsers = async () => {
  const result = await short_urlModel.updateMany(
    { user: { $exists: false } },
    { $set: { user: null } }
  );
  if (result.modifiedCount > 0) {
    logger.info('Backfilled anonymous short URL user field', {
      count: result.modifiedCount
    });
  }
};

export const backfillCanonicalUrls = async () => {
  const missing = await short_urlModel
    .find({
      $or: [{ canonical_url: { $exists: false } }, { canonical_url: null }]
    })
    .select('_id full_url')
    .lean();

  if (missing.length === 0) return;

  let updated = 0;
  for (const doc of missing) {
    try {
      const canonical_url = normalizeUrl(doc.full_url);
      await short_urlModel.updateOne(
        { _id: doc._id },
        { $set: { canonical_url } }
      );
      updated++;
    } catch (error) {
      logger.warn('Skipped canonical_url backfill for short URL', {
        id: doc._id,
        error: error.message
      });
    }
  }

  if (updated > 0) {
    logger.info('Backfilled canonical_url on short URLs', { count: updated });
  }
};

/**
 * Remove duplicate (user, canonical_url) rows so lookups stay stable.
 * Keeps the row with the highest click count, then earliest createdAt.
 */
export const deduplicateShortUrlsByUserAndFullUrl = async () => {
  const duplicateGroups = await short_urlModel.aggregate([
    {
      $group: {
        _id: { user: '$user', canonical_url: '$canonical_url' },
        ids: { $push: '$_id' },
        count: { $sum: 1 }
      }
    },
    { $match: { count: { $gt: 1 } } }
  ]);

  if (duplicateGroups.length === 0) return;

  let removed = 0;

  for (const group of duplicateGroups) {
    const docs = await short_urlModel
      .find({ _id: { $in: group.ids } })
      .select('_id click createdAt short_url')
      .sort({ click: -1, createdAt: 1 })
      .lean();

    const [keeper, ...duplicates] = docs;
    if (duplicates.length === 0) continue;

    const extraClicks = duplicates.reduce(
      (sum, doc) => sum + (doc.click || 0),
      0
    );
    const duplicateIds = duplicates.map((doc) => doc._id);

    if (extraClicks > 0) {
      await short_urlModel.updateOne(
        { _id: keeper._id },
        { $inc: { click: extraClicks } }
      );
    }

    await Click.updateMany(
      { short_url_id: { $in: duplicateIds } },
      { $set: { short_url_id: keeper._id } }
    );

    await short_urlModel.deleteMany({ _id: { $in: duplicateIds } });
    removed += duplicates.length;
  }

  logger.info('Deduplicated short URLs by user and canonical_url', {
    groups: duplicateGroups.length,
    removed
  });
};

async function hasDuplicateUserCanonicalPairs() {
  const duplicates = await short_urlModel.aggregate([
    {
      $group: {
        _id: { user: '$user', canonical_url: '$canonical_url' },
        count: { $sum: 1 }
      }
    },
    { $match: { count: { $gt: 1 } } },
    { $limit: 1 }
  ]);
  return duplicates.length > 0;
}

/** Runs only work that is still needed (cheap checks first). */
export const migrateShortUrlData = async () => {
  const needsUserBackfill = await short_urlModel.exists({
    user: { $exists: false }
  });
  if (needsUserBackfill) {
    await backfillAnonymousShortUrlUsers();
  }

  await backfillCanonicalUrls();

  if (process.env.SHORT_URL_DEDUPE_ON_STARTUP === 'true') {
    if (await hasDuplicateUserCanonicalPairs()) {
      await deduplicateShortUrlsByUserAndFullUrl();
    }
  } else if (await hasDuplicateUserCanonicalPairs()) {
    logger.warn(
      'Duplicate (user, canonical_url) short URL rows detected; set SHORT_URL_DEDUPE_ON_STARTUP=true to merge on startup'
    );
  }

  await short_urlModel.syncIndexes();
};
