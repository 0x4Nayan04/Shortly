import crypto from 'crypto';
import { MAX_LINKS_PER_USER, CLICK_RETENTION_DAYS } from '../constants/shortUrlLimits.js';
import {
  countActiveLinksForUser,
  claimAnonymousLink,
  findActiveLinkBySlug,
  findAnonymousByIdAndToken,
  findExistingForCanonical,
  findOwnedActiveById,
  findOwnedActiveByIds,
  findOwnedDuplicateByCanonical,
  findTopClickedForUser,
  isSlugAvailable,
  listForUser,
  purgeReclaimableSlug,
  saveShortUrl,
  softDeleteById,
  softDeleteByIdAndUser,
  softDeleteManyByIdsAndUser,
  aggregateLifetimeStatsForUser,
  aggregateRecentActivityForUser,
  updateByIdAndUser
} from '../dao/shortUrl.dao.js';
import { generateNanoId } from '../utils/helper.js';
import { AppError, NotFoundError } from '../utils/errorHandler.js';
import { normalizeSlug } from '../utils/normalizeSlug.js';
import { normalizeUrl } from '../utils/normalizeUrl.js';
import { validateCustomSlug } from '../utils/validateCustomSlug.js';
import {
  getCachedRedirectTarget,
  setCachedRedirectTarget,
  invalidateRedirectSlugCache
} from '../utils/redirectSlugCache.js';
import { getClickAggregates } from './analytics.service.js';
import {
  CUSTOM_SLUG_TAKEN_MESSAGE,
  withSlugConflictHandler
} from '../utils/slugErrors.js';
import { hashEmailToken } from '../utils/hashToken.js';

const generateManageToken = () => crypto.randomBytes(24).toString('hex');
const hashManageToken = (token) => hashEmailToken(token);

const assertUserLinkCapacity = async (userId) => {
  if (!userId) return;
  const count = await countActiveLinksForUser(userId);
  if (count >= MAX_LINKS_PER_USER) {
    throw new AppError(
      `Link limit reached (${MAX_LINKS_PER_USER}). Delete unused links to create more.`,
      403
    );
  }
};

const generateUniqueShortUrl = async () => {
  let short_url;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 5;

  while (!isUnique && attempts < maxAttempts) {
    short_url = generateNanoId(7);
    if (await isSlugAvailable(short_url)) {
      isUnique = true;
    }
    attempts++;
  }

  if (!isUnique) {
    throw new AppError(
      'Could not generate unique short URL after multiple attempts',
      500
    );
  }

  return normalizeSlug(short_url);
};

const buildExistingReuseResult = (doc) => ({
  short_url: doc.short_url,
  id: doc._id?.toString(),
  created: false,
  reused: true
});

const findExistingLinkForCanonical = async (canonical_url, userId) => {
  const doc = await findExistingForCanonical(canonical_url, userId);
  return doc ? buildExistingReuseResult(doc) : null;
};

const saveShortUrlWithRetry = async ({
  short_url,
  full_url,
  canonical_url,
  userId,
  manage_token = null
}) => {
  await purgeReclaimableSlug(short_url);

  try {
    const saved = await saveShortUrl({
      short_url,
      full_url,
      canonical_url,
      userId,
      manage_token
    });
    return { ...saved, created: true, reused: false };
  } catch (err) {
    if (err.code !== 11000) throw err;

    const keys = err.keyPattern ? Object.keys(err.keyPattern) : [];
    if (!keys.includes('short_url')) throw err;

    if (userId) {
      const existing = await findExistingLinkForCanonical(canonical_url, userId);
      if (existing) return existing;
    }

    const fallback = await generateUniqueShortUrl();
    return saveShortUrlWithRetry({
      short_url: fallback,
      full_url,
      canonical_url,
      userId,
      manage_token
    });
  }
};

export async function createShortUrl({ full_url, userId = null }) {
  const canonical_url = normalizeUrl(full_url);
  const existing = await findExistingLinkForCanonical(canonical_url, userId);
  if (existing) return existing;

  if (userId) await assertUserLinkCapacity(userId);

  const short_url = await generateUniqueShortUrl();
  const rawManageToken = userId ? null : generateManageToken();
  const storedManageToken = rawManageToken ? hashManageToken(rawManageToken) : null;
  const saved = await saveShortUrlWithRetry({
    short_url,
    full_url: canonical_url,
    canonical_url,
    userId,
    manage_token: storedManageToken
  });

  return rawManageToken ? { ...saved, manage_token: rawManageToken } : saved;
}

export async function createCustomShortUrl({ full_url, custom_url, userId }) {
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

export async function getShortUrl(short_url) {
  const slug = normalizeSlug(short_url);
  const shortUrlData = await findActiveLinkBySlug(slug);
  if (!shortUrlData) {
    throw new NotFoundError('Short URL not found');
  }
  return shortUrlData;
}

export async function resolveRedirectTarget(short_url) {
  const cached = getCachedRedirectTarget(short_url);
  if (cached) return cached;

  const shortUrlData = await getShortUrl(short_url);
  setCachedRedirectTarget(short_url, shortUrlData);
  return shortUrlData;
}

export async function claimAnonymousLinks({ userId, claims }) {
  await assertUserLinkCapacity(userId);

  const claimed = [];
  const skipped = [];

  await Promise.all(
    claims.map(async ({ id, manage_token }) => {
      if (!id || !manage_token) {
        skipped.push({ id, reason: 'missing_id_or_token' });
        return;
      }

      const doc = await findAnonymousByIdAndToken(id, hashManageToken(manage_token));
      if (!doc) {
        skipped.push({ id, reason: 'not_found_or_invalid_token' });
        return;
      }

      const ownedDuplicate = await findOwnedDuplicateByCanonical(userId, doc.canonical_url);
      if (ownedDuplicate) {
        await softDeleteById(doc._id);
        skipped.push({
          id,
          reason: 'duplicate_destination',
          short_url: doc.short_url
        });
        return;
      }

      await claimAnonymousLink(doc._id, userId);
      claimed.push({ id, short_url: doc.short_url });
    })
  );

  return { claimed, skipped };
}

export async function updateOwnedShortUrl({ userId, id, updates }) {
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
    updated = await withSlugConflictHandler(() => updateByIdAndUser(id, userId, patch));
  }

  for (const slug of slugsToInvalidate) {
    invalidateRedirectSlugCache(slug);
  }

  return updated;
}

export async function listLinksForUser({
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

export async function softDeleteLink({ userId, id }) {
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

export async function softDeleteLinks({ userId, ids }) {
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

export async function getStatsForUser({ userId }) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [lifetime, recentCreations, topUrls, clickStats] = await Promise.all([
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
    recentCreations,
    topUrls,
    clickAnalytics: clickStats
  };
}
