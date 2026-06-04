import crypto from 'crypto';
import { CLICK_RETENTION_DAYS } from '../constants/shortUrlLimits.js';
import {
  findExistingForCanonical,
  findOwnedActiveById,
  findOwnedActiveByIds,
  findTopClickedForUser,
  isSlugAvailable,
  listForUser,
  purgeReclaimableSlug,
  saveShortUrl,
  softDeleteByIdAndUser,
  softDeleteManyByIdsAndUser,
  aggregateLifetimeStatsForUser,
  aggregateRecentActivityForUser,
  updateByIdAndUser
} from '../dao/shortUrl.dao.js';
import { AppError, NotFoundError } from '../utils/errorHandler.js';
import { normalizeSlug } from '../utils/normalizeSlug.js';
import { normalizeUrl } from '../utils/normalizeUrl.js';
import { validateCustomSlug } from '../utils/validateCustomSlug.js';
import { invalidateRedirectSlugCache } from '../utils/redirectSlugCache.js';
import { getClickAggregates } from './analytics.service.js';
import {
  CUSTOM_SLUG_TAKEN_MESSAGE,
  withSlugConflictHandler
} from '../utils/slugErrors.js';
import { hashEmailToken } from '../utils/hashToken.js';
import { assertUserLinkCapacity } from './shortUrl/linkCapacity.js';
import {
  buildExistingReuseResult,
  generateUniqueShortUrl,
  saveShortUrlOnDuplicateSlug
} from './shortUrl/persistShortUrl.js';
export { claimAnonymousLinksService } from './shortUrl/claimAnonymousLinks.js';
export {
  getShortUrlService,
  resolveRedirectTargetService
} from './shortUrl/redirect.js';

const generateManageToken = () => crypto.randomBytes(24).toString('hex');
const hashManageToken = (token) => hashEmailToken(token);

export async function createShortUrlService({ full_url, userId = null }) {
  const canonical_url = normalizeUrl(full_url);
  const existingDoc = await findExistingForCanonical(canonical_url, userId);
  if (existingDoc) return buildExistingReuseResult(existingDoc);

  if (userId) await assertUserLinkCapacity(userId);

  const short_url = await generateUniqueShortUrl();
  const rawManageToken = userId ? null : generateManageToken();
  const storedManageToken = rawManageToken
    ? hashManageToken(rawManageToken)
    : null;
  const saved = await saveShortUrlOnDuplicateSlug({
    short_url,
    full_url: canonical_url,
    canonical_url,
    userId,
    manage_token: storedManageToken
  });

  return rawManageToken ? { ...saved, manage_token: rawManageToken } : saved;
}

export async function createCustomShortUrlService({
  full_url,
  custom_url,
  userId
}) {
  await assertUserLinkCapacity(userId);

  const canonical_url = normalizeUrl(full_url);
  let slug;
  try {
    slug = validateCustomSlug(custom_url);
  } catch (err) {
    throw new AppError(err.message, 400);
  }

  if (!(await isSlugAvailable(slug))) {
    throw new AppError(CUSTOM_SLUG_TAKEN_MESSAGE, 409);
  }

  await purgeReclaimableSlug(slug);

  const saved = await withSlugConflictHandler(
    () =>
      saveShortUrl({
        short_url: slug,
        full_url: canonical_url,
        canonical_url,
        userId
      }),
    CUSTOM_SLUG_TAKEN_MESSAGE
  );

  return {
    short_url: saved.short_url,
    id: saved.id,
    full_url: canonical_url,
    custom_url: slug,
    user_authenticated: true,
    created: true,
    reused: false
  };
}

export async function updateOwnedShortUrlService({ userId, id, updates }) {
  const url = await findOwnedActiveById(id, userId);
  if (!url) {
    throw new NotFoundError('URL not found');
  }

  const previousSlug = url.short_url;
  const patch = {};
  const slugsToInvalidate = new Set();

  if (updates.full_url !== undefined) {
    const canonical_url = normalizeUrl(updates.full_url);
    patch.full_url = canonical_url;
    patch.canonical_url = canonical_url;
    slugsToInvalidate.add(previousSlug);
  }

  if (updates.disabled !== undefined) {
    patch.disabled = updates.disabled;
    slugsToInvalidate.add(previousSlug);
  }

  if (updates.short_url !== undefined) {
    const nextSlug = normalizeSlug(updates.short_url);
    if (nextSlug !== previousSlug) {
      try {
        validateCustomSlug(nextSlug);
      } catch (err) {
        throw new AppError(err.message, 400);
      }
      if (!(await isSlugAvailable(nextSlug))) {
        throw new AppError(CUSTOM_SLUG_TAKEN_MESSAGE, 409);
      }
      await purgeReclaimableSlug(nextSlug);
      patch.short_url = nextSlug;
      slugsToInvalidate.add(previousSlug);
      slugsToInvalidate.add(nextSlug);
    }
  }

  let updated = url;
  if (Object.keys(patch).length > 0) {
    updated = await withSlugConflictHandler(() =>
      updateByIdAndUser(id, userId, patch)
    );
  }

  for (const slug of slugsToInvalidate) {
    invalidateRedirectSlugCache(slug);
  }

  return updated;
}

export async function listLinksForUserService({
  userId,
  limit = 20,
  skip = 0,
  search,
  sortBy = 'createdAt',
  sortOrder = 'desc'
}) {
  const { urls, totalCount } = await listForUser({
    userId,
    limit,
    skip,
    search,
    sortBy,
    sortOrder: sortOrder === 'asc' ? 1 : -1
  });

  const currentPage = Math.floor(skip / limit) + 1;
  const totalPages = Math.ceil(totalCount / limit);

  return {
    urls,
    totalCount,
    currentPage,
    totalPages,
    perPage: limit,
    hasMore: skip + limit < totalCount
  };
}

export async function softDeleteLinkService({ userId, id }) {
  const existing = await findOwnedActiveById(id, userId);
  if (!existing) {
    throw new NotFoundError('URL not found');
  }

  const removed = await softDeleteByIdAndUser(id, userId);
  if (!removed) {
    throw new AppError('You can only delete your own URLs', 403);
  }

  invalidateRedirectSlugCache(existing.short_url);
}

export async function softDeleteLinksService({ userId, ids }) {
  const owned = await findOwnedActiveByIds(ids, userId);
  const ownedIds = owned.map((u) => u._id.toString());

  if (ownedIds.length === 0) {
    return {
      deletedCount: 0,
      deletedIds: [],
      skippedIds: ids.map((id) => ({ id, reason: 'not_found' }))
    };
  }

  const deletedCount = await softDeleteManyByIdsAndUser(ownedIds, userId);

  for (const url of owned) {
    invalidateRedirectSlugCache(url.short_url);
  }

  const skippedIds = ids
    .filter((id) => !ownedIds.includes(id))
    .map((id) => ({ id, reason: 'not_found' }));

  return {
    deletedCount,
    deletedIds: ownedIds,
    skippedIds
  };
}

export async function getStatsForUserService({ userId }) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [lifetime, recentActivity, topUrls, clickStats] = await Promise.all([
    aggregateLifetimeStatsForUser(userId),
    aggregateRecentActivityForUser(userId, sevenDaysAgo),
    findTopClickedForUser(userId),
    getClickAggregates(userId)
  ]);

  return {
    stats: {
      totalUrls: lifetime.totalUrls,
      totalClicks: lifetime.totalClicksLifetime,
      avgClicksPerUrl: Math.round(lifetime.avgClicks * 100) / 100,
      clickEventRetentionDays: CLICK_RETENTION_DAYS
    },
    recentActivity,
    topUrls,
    clickAnalytics: clickStats
  };
}
