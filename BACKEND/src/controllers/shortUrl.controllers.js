import asyncHandler from '../utils/asyncHandler.js';
import { AppError, NotFoundError } from '../utils/errorHandler.js';
import { isSafeRedirectUrl } from '../utils/safeRedirectUrl.js';
import { normalizeSlug } from '../utils/normalizeSlug.js';
import { normalizeUrl } from '../utils/normalizeUrl.js';
import { logger } from '../utils/logger.js';
import {
  successResponse,
  SUCCESS_MESSAGES
} from '../utils/responseMessages.js';
import {
  createShortUrl as createShortUrlService,
  createCustomShortUrl as createCustomShortUrlService,
  resolveRedirectTarget,
  claimAnonymousLinks as claimAnonymousLinksService,
  updateOwnedShortUrl,
  listLinksForUser,
  softDeleteLink,
  softDeleteLinks,
  getStatsForUser
} from '../services/shortUrl.services.js';
import { recordClickFromRequest } from '../services/click.service.js';

const resolveCanonicalUrl = (full_url) => {
  const canonical_url = normalizeUrl(full_url);
  if (!isSafeRedirectUrl(canonical_url)) {
    throw new AppError(
      'URL must be a public http(s) address; private or local targets are not allowed',
      400
    );
  }
  return canonical_url;
};

export const createShortUrl = asyncHandler(async (req, res, _next) => {
  const { full_url } = req.validatedBody;
  const canonical_url = resolveCanonicalUrl(full_url);
  const userId = req.user ? req.user._id : null;

  const result = await createShortUrlService({ full_url: canonical_url, userId });

  const payload = {
    id: result.id,
    short_url: result.short_url,
    full_url: canonical_url,
    user_authenticated: !!userId,
    created: result.created,
    reused: result.reused
  };

  if (result.manage_token) {
    payload.manage_token = result.manage_token;
  }

  res.json(successResponse(SUCCESS_MESSAGES.URL.CREATED, payload));
});

export const redirectFromShortUrl = asyncHandler(async (req, res, next) => {
  const { short_url } = req.validatedParams;

  const shortUrlData = await resolveRedirectTarget(short_url);

  if (!isSafeRedirectUrl(shortUrlData.full_url)) {
    logger.warn('Blocked unsafe redirect destination', {
      short_url,
      full_url: shortUrlData.full_url
    });
    return next(new AppError('Invalid redirect destination', 400));
  }

  res.redirect(302, shortUrlData.full_url);
  res.once('finish', () => {
    recordClickFromRequest({ shortUrlId: shortUrlData._id, req });
  });
});

export const getUserUrls = asyncHandler(async (req, res, _next) => {
  const userId = req.user._id;
  const { limit, skip, search, sortBy, sortOrder } = req.validatedQuery;

  const result = await listLinksForUser({
    userId,
    limit,
    skip,
    search,
    sortBy,
    sortOrder
  });

  res.setHeader('X-Page', result.currentPage);
  res.setHeader('X-Per-Page', result.perPage);
  res.setHeader('X-Total-Count', result.totalCount);
  res.setHeader('X-Total-Pages', result.totalPages);

  res.json(
    successResponse('User URLs fetched', {
      count: result.urls.length,
      totalCount: result.totalCount,
      totalPages: result.totalPages,
      currentPage: result.currentPage,
      hasMore: result.hasMore,
      urls: result.urls
    })
  );
});

export const createCustomShortUrl = asyncHandler(async (req, res, _next) => {
  const { full_url, custom_url } = req.validatedBody;
  const userId = req.user._id;
  const canonical_url = resolveCanonicalUrl(full_url);

  const result = await createCustomShortUrlService({
    full_url: canonical_url,
    custom_url,
    userId
  });

  res.json(
    successResponse(SUCCESS_MESSAGES.URL.CUSTOM_CREATED, {
      ...result,
      custom_url: normalizeSlug(custom_url)
    })
  );
});

export const updateShortUrl = asyncHandler(async (req, res, next) => {
  const { id } = req.validatedParams;
  const userId = req.user._id;
  const updates = req.validatedBody;

  if (updates.full_url !== undefined) {
    updates.full_url = resolveCanonicalUrl(updates.full_url);
  }

  if (updates.short_url !== undefined) {
    updates.short_url = normalizeSlug(updates.short_url);
  }

  const updated = await updateOwnedShortUrl({ userId, id, updates });

  if (!updated) {
    return next(new NotFoundError('URL not found'));
  }

  res.json(
    successResponse('URL updated successfully', {
      url: {
        id: updated._id,
        short_url: updated.short_url,
        full_url: updated.full_url,
        disabled: updated.disabled,
        click: updated.click,
        createdAt: updated.createdAt
      }
    })
  );
});

export const deleteShortUrl = asyncHandler(async (req, res, _next) => {
  const { id } = req.validatedParams;
  const userId = req.user._id;

  await softDeleteLink({ userId, id });

  res.json(successResponse(SUCCESS_MESSAGES.URL.DELETED));
});

export const claimAnonymousShortUrls = asyncHandler(async (req, res, _next) => {
  const userId = req.user._id;
  const { links } = req.validatedBody;
  const result = await claimAnonymousLinksService({ userId, claims: links });

  res.json(
    successResponse('Anonymous links processed', {
      claimed: result.claimed,
      skipped: result.skipped
    })
  );
});

export const bulkDeleteUrls = asyncHandler(async (req, res, _next) => {
  const { ids } = req.validatedBody;
  const userId = req.user._id;

  const result = await softDeleteLinks({ userId, ids });

  if (result.deletedCount === 0) {
    throw new AppError('No matching URLs found to delete', 404, true, {
      skippedIds: result.skippedIds
    });
  }

  res.json(
    successResponse(
      `Deleted ${result.deletedCount} of ${ids.length} URL(s)`,
      {
        deletedCount: result.deletedCount,
        deletedIds: result.deletedIds,
        skippedIds: result.skippedIds.map((entry) => entry.id)
      }
    )
  );
});

export const getUrlStats = asyncHandler(async (req, res, _next) => {
  const userId = req.user._id;

  const result = await getStatsForUser({ userId });

  res.json(successResponse('URL stats fetched', result));
});
