import crypto from 'crypto';
import { CLICK_RETENTION_DAYS } from '../constants/shortUrlLimits.js';
import {
  findExistingForCanonical,
  findOwnedActiveById,
  findOwnedActiveByIds,
  findTopClickedForUser,
  isSlugAvailable,
  listForUser,
  saveShortUrl,
  retireByIdAndUser,
  retireManyByIdsAndUser,
  aggregateLifetimeStatsForUser,
  aggregateRecentActivityForUser,
  updateByIdAndUser
} from '../dao/shortUrl.dao.js';
import { AppError, NotFoundError } from '../utils/errorHandler.js';
import { normalizeSlug } from '../utils/normalizeSlug.js';
import { normalizeUrl } from '../utils/normalizeUrl.js';
import { validateCustomSlug } from '../utils/validateCustomSlug.js';
import { getClickAggregates } from './analytics.service.js';
import {
  CUSTOM_SLUG_TAKEN_MESSAGE,
  withSlugConflictHandler
} from '../utils/slugErrors.js';
import { hashEmailToken } from '../utils/hashToken.js';
import {
  reserveActiveLinkSlot,
  releaseActiveLinkSlots
} from '../dao/user.dao.js';
import { runWithTransaction } from '../utils/mongoTransaction.js';
import {
  buildExistingReuseResult,
  generateUniqueShortUrl,
  saveShortUrlOnDuplicateSlug
} from './shortUrl/persistShortUrl.js';
export { claimAnonymousLinksService } from './shortUrl/claimAnonymousLinks.js';
export {
  emailAnonymousClaimRecoveryService,
  redeemAnonymousClaimRecoveryService
} from './shortUrl/claimRecovery.js';
export {
  getShortUrlService,
  resolveRedirectTargetService
} from './shortUrl/redirect.js';

const generateManageToken = () => crypto.randomBytes(24).toString('hex');
const hashManageToken = (token) => hashEmailToken(token);
const STATS_CACHE_TTL_MS = 30_000;
const STATS_CACHE_MAX = 5_000;
const statsCache = new Map();

export const invalidateStatsForUser = (userId) => {
  if (userId) statsCache.delete(userId.toString());
};

const reserveSlotOrThrow = async (userId, session) => {
  const reserved = await reserveActiveLinkSlot(userId, session);
  if (reserved) return;
  throw new AppError('Link limit reached. Delete unused links first.', 403);
};

export async function createShortUrlService({ full_url, userId = null }) {
  const canonical_url = normalizeUrl(full_url);
  if (userId) {
    const existingDoc = await findExistingForCanonical(canonical_url, userId);
    if (existingDoc) return buildExistingReuseResult(existingDoc);
  }

  const short_url = await generateUniqueShortUrl();
  const rawManageToken = userId ? null : generateManageToken();
  const storedManageToken = rawManageToken
    ? hashManageToken(rawManageToken)
    : null;
  let saved;
  if (userId) {
    try {
      saved = await runWithTransaction(async (session) => {
        await reserveSlotOrThrow(userId, session);
        return saveShortUrlOnDuplicateSlug({
          short_url,
          full_url: canonical_url,
          canonical_url,
          userId,
          session
        });
      });
    } catch (error) {
      if (error.code !== 11000 || !error.keyPattern?.canonical_url) throw error;
      const existing = await findExistingForCanonical(canonical_url, userId);
      if (existing) return buildExistingReuseResult(existing);
      throw error;
    }
  } else {
    saved = await saveShortUrlOnDuplicateSlug({
      short_url,
      full_url: canonical_url,
      canonical_url,
      userId,
      manage_token: storedManageToken
    });
  }

  invalidateStatsForUser(userId);
  return rawManageToken ? { ...saved, manage_token: rawManageToken } : saved;
}

export async function createCustomShortUrlService({
  full_url,
  custom_url,
  userId
}) {
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

  const saved = await withSlugConflictHandler(
    () =>
      runWithTransaction(async (session) => {
        await reserveSlotOrThrow(userId, session);
        return saveShortUrl({
          short_url: slug,
          full_url: canonical_url,
          canonical_url,
          userId,
          session
        });
      }),
    CUSTOM_SLUG_TAKEN_MESSAGE
  );
  invalidateStatsForUser(userId);

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

  if (updates.full_url !== undefined) {
    const canonical_url = normalizeUrl(updates.full_url);
    patch.full_url = canonical_url;
    patch.canonical_url = canonical_url;
  }

  if (updates.disabled !== undefined) {
    patch.disabled = updates.disabled;
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
      patch.short_url = nextSlug;
    }
  }

  let updated = url;
  if (Object.keys(patch).length > 0) {
    updated = await withSlugConflictHandler(() =>
      updateByIdAndUser(id, userId, patch)
    );
  }
  invalidateStatsForUser(userId);

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

  const removed = await runWithTransaction(async (session) => {
    const retired = await retireByIdAndUser(id, userId, session);
    if (retired) await releaseActiveLinkSlots(userId, 1, session);
    return retired;
  });
  if (!removed) {
    throw new AppError('You can only delete your own URLs', 403);
  }
  invalidateStatsForUser(userId);
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

  const deletedCount = await runWithTransaction(async (session) => {
    const count = await retireManyByIdsAndUser(ownedIds, userId, session);
    await releaseActiveLinkSlots(userId, count, session);
    return count;
  });

  const skippedIds = ids
    .filter((id) => !ownedIds.includes(id))
    .map((id) => ({ id, reason: 'not_found' }));

  invalidateStatsForUser(userId);
  return {
    deletedCount,
    deletedIds: ownedIds,
    skippedIds
  };
}

export async function getStatsForUserService({ userId }) {
  const cacheKey = userId.toString();
  const cached = statsCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const pending = buildStatsForUser(userId).catch((error) => {
    statsCache.delete(cacheKey);
    throw error;
  });
  if (statsCache.size >= STATS_CACHE_MAX) {
    statsCache.delete(statsCache.keys().next().value);
  }
  statsCache.set(cacheKey, {
    value: pending,
    expiresAt: Date.now() + STATS_CACHE_TTL_MS
  });
  return pending;
}

async function buildStatsForUser(userId) {
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
