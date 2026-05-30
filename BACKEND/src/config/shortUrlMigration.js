import short_urlModel from '../schema/shortUrl.model.js';
import Click from '../schema/click.model.js';
import { logger } from '../utils/logger.js';

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

/**
 * Remove duplicate (user, full_url) rows so the unique compound index can apply.
 * Keeps the row with the highest click count, then earliest createdAt.
 */
export const deduplicateShortUrlsByUserAndFullUrl = async () => {
  const duplicateGroups = await short_urlModel.aggregate([
    {
      $group: {
        _id: { user: '$user', full_url: '$full_url' },
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

  logger.info('Deduplicated short URLs by user and full_url', {
    groups: duplicateGroups.length,
    removed
  });
};

async function hasDuplicateUserFullUrlPairs() {
  const duplicates = await short_urlModel.aggregate([
    {
      $group: {
        _id: { user: '$user', full_url: '$full_url' },
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

  if (await hasDuplicateUserFullUrlPairs()) {
    await deduplicateShortUrlsByUserAndFullUrl();
  }
};
