import { measureRequestStep, recordTimingState } from '../utils/requestTiming.js';
import crypto from 'crypto';
import { CLICK_RETENTION_DAYS } from '../constants/shortUrlLimits.js';
import {
  findExistingForCanonical,
  findOwnedActiveById,
  findOwnedActiveByIds,
  isSlugAvailable,
  listForUser,
  saveShortUrl,
  retireByIdAndUser,
  retireManyByIdsAndUser,
  aggregateOverviewForUser,
  updateByIdAndUser
} from '../dao/shortUrl.dao.js';
import { deleteClicksForLinks } from '../dao/click.dao.js';
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
import {
  invalidateRedirectCache,
  invalidateRedirectCacheMany,
  clearRedirectCache
} from './shortUrl/redirectCache.js';

export { claimAnonymousLinksService } from './shortUrl/claimAnonymousLinks.js';
export {
  emailAnonymousClaimRecoveryService,
  redeemAnonymousClaimRecoveryService
} from './shortUrl/claimRecovery.js';
export {
  getShortUrlService,
  resolveRedirectTargetService
} from './shortUrl/redirect.js';
export {
  invalidateRedirectCache,
  invalidateRedirectCacheMany,
  clearRedirectCache
};

const generateManageToken = () => crypto.randomBytes(24).toString('hex');
const hashManageToken = (token) => hashEmailToken(token);
const STATS_CACHE_TTL_MS = 30_000;
const STATS_CACHE_MAX = 5_000;
const overviewStatsCache = new Map();
const clickAnalyticsCache = new Map();

const readCached = (cache, key) => {
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  if (cached) cache.delete(key);
  return null;
};

const writeCached = (cache, key, value) => {
  if (cache.size >= STATS_CACHE_MAX) {
    cache.delete(cache.keys().next().value);
  }
  cache.set(key, {
    value,
    expiresAt: Date.now() + STATS_CACHE_TTL_MS
  });
};

export const invalidateStatsForUser = (userId) => {
  if (!userId) return;
  const key = userId.toString();
  overviewStatsCache.delete(key);
  clickAnalyticsCache.delete(key);
};

const reserveSlotOrThrow = async (userId, session) => {
  const reserved = await measureRequestStep('create.reserveSlot', () =>
    reserveActiveLinkSlot(userId, session)
  );
  if (reserved) return;
  throw new AppError('Link limit reached. Delete unused links first.', 403);
};

export async function createShortUrlService({ full_url, userId = null }) {
  const canonical_url = normalizeUrl(full_url);
  if (userId) {
    const existingDoc = await measureRequestStep('create.canonicalLookup', () =>
      findExistingForCanonical(canonical_url, userId)
    );
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
      const existing = await measureRequestStep('create.canonicalLookup', () =>
        findExistingForCanonical(canonical_url, userId)
      );
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
  const url = await measureRequestStep('link.ownershipLookup', () =>
    findOwnedActiveById(id, userId)
  );
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
    if (!updated) throw new NotFoundError('URL not found');
    invalidateRedirectCache(previousSlug);
    if (patch.short_url) invalidateRedirectCache(patch.short_url);
  }

  if (patch.full_url !== undefined || patch.short_url !== undefined) {
    invalidateStatsForUser(userId);
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
  const existing = await measureRequestStep('link.ownershipLookup', () =>
    findOwnedActiveById(id, userId)
  );
  if (!existing) {
    throw new NotFoundError('URL not found');
  }

  const removed = await runWithTransaction(async (session) => {
    const retired = await retireByIdAndUser(id, userId, session);
    if (retired) {
      await deleteClicksForLinks([id], session);
      await releaseActiveLinkSlots(userId, 1, session);
    }
    return retired;
  });
  if (!removed) {
    throw new AppError('You can only delete your own URLs', 403);
  }
  invalidateRedirectCache(existing.short_url);
  invalidateStatsForUser(userId);
}

export async function softDeleteLinksService({ userId, ids }) {
  const { owned, deletedCount } = await runWithTransaction(async (session) => {
    const links = await findOwnedActiveByIds(ids, userId, session);
    const linkIds = links.map((link) => link._id);
    const count = await retireManyByIdsAndUser(linkIds, userId, session);
    await deleteClicksForLinks(linkIds, session);
    await releaseActiveLinkSlots(userId, count, session);
    return { owned: links, deletedCount: count };
  });
  const ownedIds = owned.map((link) => link._id.toString());

  const skippedIds = ids
    .filter((id) => !ownedIds.includes(id))
    .map((id) => ({ id, reason: 'not_found' }));

  invalidateRedirectCacheMany(owned.map((link) => link.short_url));
  invalidateStatsForUser(userId);
  return {
    deletedCount,
    deletedIds: ownedIds,
    skippedIds
  };
}

export async function getStatsForUserService({ userId }) {
  const cacheKey = userId.toString();
  const cached = readCached(overviewStatsCache, cacheKey);
  recordTimingState('overviewCacheHit', Boolean(cached));
  if (cached) return cached;

  const pending = buildOverviewStatsForUser(userId).catch((error) => {
    overviewStatsCache.delete(cacheKey);
    throw error;
  });
  writeCached(overviewStatsCache, cacheKey, pending);
  return pending;
}

export async function getClickAnalyticsForUserService({ userId }) {
  const cacheKey = userId.toString();
  const cached = readCached(clickAnalyticsCache, cacheKey);
  recordTimingState('analyticsCacheHit', Boolean(cached));
  if (cached) return cached;

  const pending = measureRequestStep('analytics.total', () =>
    getClickAggregates(userId)
  )
    .then((clickAnalytics) => ({ clickAnalytics }))
    .catch((error) => {
      clickAnalyticsCache.delete(cacheKey);
      throw error;
    });
  writeCached(clickAnalyticsCache, cacheKey, pending);
  return pending;
}

async function buildOverviewStatsForUser(userId) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const { lifetime, recentActivity, topUrls } = await measureRequestStep(
    'overview.aggregate', () => aggregateOverviewForUser(userId, sevenDaysAgo)
  );

  return {
    stats: {
      totalUrls: lifetime.totalUrls,
      totalClicks: lifetime.totalClicksLifetime,
      avgClicksPerUrl: Math.round(lifetime.avgClicks * 100) / 100,
      clickEventRetentionDays: CLICK_RETENTION_DAYS
    },
    recentActivity,
    topUrls
  };
}
