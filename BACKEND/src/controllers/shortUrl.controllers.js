import mongoose from 'mongoose';
import short_urlModel from '../schema/shortUrl.model.js';
import {
  createShortUrlWithoutUser,
  createShortUrlWithUser,
  createCustomShortUrl as createCustomShortUrlService,
  getShortUrl,
  claimAnonymousLinks as claimAnonymousLinksService,
  deleteAnonymousLink as deleteAnonymousLinkService,
  updateOwnedShortUrl,
  normalizeUrl
} from '../services/shortUrl.services.js';
import { getClickAggregates } from '../services/analytics.service.js';
import Click from '../schema/click.model.js';
import { CLICK_RETENTION_DAYS } from '../constants/shortUrlLimits.js';
import { AppError, NotFoundError } from '../utils/errorHandler.js';
import asyncHandler from '../utils/asyncHandler.js';
import { getCountryFromRequest } from '../utils/geoip.js';
import { parseUserAgent } from '../utils/userAgent.js';
import { isBotUserAgent } from '../utils/isBotUserAgent.js';
import {
  SUCCESS_MESSAGES,
  successResponse
} from '../utils/responseMessages.js';
import { escapeRegExp } from '../utils/escapeRegExp.js';
import { logger } from '../utils/logger.js';
import { retryWithBackoff } from '../utils/retry.js';
import { isSafeRedirectUrl } from '../utils/safeRedirectUrl.js';
import { normalizeSlug } from '../utils/normalizeSlug.js';

const activeLinkFilter = { deletedAt: null };

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

  const existingQuery = userId
    ? { canonical_url, user: userId, ...activeLinkFilter }
    : { canonical_url, user: null, ...activeLinkFilter };

  const existing = await short_urlModel
    .findOne(existingQuery)
    .sort({ createdAt: 1 })
    .select('short_url _id')
    .lean();

  let short_url;
  let linkId;
  let manage_token;
  let created = false;

  if (!existing) {
    created = true;
    if (userId) {
      ({ short_url, id: linkId } = await createShortUrlWithUser(
        canonical_url,
        userId
      ));
    } else {
      ({
        short_url,
        id: linkId,
        manage_token
      } = await createShortUrlWithoutUser(canonical_url));
    }
  } else {
    short_url = existing.short_url;
    linkId = existing._id?.toString();
  }

  const payload = {
    id: linkId,
    short_url,
    full_url: canonical_url,
    user_authenticated: !!userId,
    created,
    reused: !created
  };

  if (manage_token) {
    payload.manage_token = manage_token;
  }

  res.json(successResponse(SUCCESS_MESSAGES.URL.CREATED, payload));
});

export const redirectFromShortUrl = asyncHandler(async (req, res, next) => {
  const { short_url } = req.validatedParams;
  const shortUrlData = await getShortUrl(short_url);

  if (!isSafeRedirectUrl(shortUrlData.full_url)) {
    logger.warn('Blocked unsafe redirect destination', {
      short_url,
      full_url: shortUrlData.full_url
    });
    return next(new AppError('Invalid redirect destination', 400));
  }

  res.redirect(302, shortUrlData.full_url);

  const userAgent = req.headers['user-agent'] || '';
  if (isBotUserAgent(userAgent)) {
    return;
  }

  const referrer = req.get('referer') || req.get('referrer') || '';
  const country = getCountryFromRequest(req);
  const { user_agent, device_type, browser, os } = parseUserAgent(req);

  const recordClick = async () => {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await short_urlModel.updateOne(
          { _id: shortUrlData._id },
          { $inc: { click: 1 } },
          { session }
        );
        await Click.create(
          [
            {
              short_url_id: shortUrlData._id,
              referrer,
              country,
              user_agent,
              device_type,
              browser,
              os,
              timestamp: new Date()
            }
          ],
          { session }
        );
      });
    } catch (error) {
      logger.error('Error recording click', {
        error: error.message,
        short_url
      });
    } finally {
      await session.endSession();
    }
  };

  res.once('finish', recordClick);
});

export const getUserUrls = asyncHandler(async (req, res, _next) => {
  const userId = req.user._id;
  const query = req.validatedQuery;
  const limit = query.limit;
  const skip = query.skip;
  const search = query.search;
  const sortBy = query.sortBy;
  const sortOrder = query.sortOrder === 'asc' ? 1 : -1;

  const baseQuery = { user: userId, ...activeLinkFilter };

  if (search && search.trim()) {
    const searchRegex = new RegExp(escapeRegExp(search.trim()), 'i');
    baseQuery.$or = [{ full_url: searchRegex }, { short_url: searchRegex }];
  }

  const sortOptions = {};
  sortOptions[sortBy] = sortOrder;

  const [userUrls, totalCount] = await Promise.all([
    short_urlModel
      .find(baseQuery)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .select('full_url short_url click createdAt disabled')
      .lean(),
    short_urlModel.countDocuments(baseQuery)
  ]);

  const currentPage = Math.floor(skip / limit) + 1;
  const totalPages = Math.ceil(totalCount / limit);

  res.setHeader('X-Page', currentPage);
  res.setHeader('X-Per-Page', limit);
  res.setHeader('X-Total-Count', totalCount);
  res.setHeader('X-Total-Pages', totalPages);

  res.json(
    successResponse('User URLs fetched', {
      count: userUrls.length,
      totalCount,
      totalPages,
      currentPage,
      hasMore: skip + limit < totalCount,
      urls: userUrls
    })
  );
});

export const createCustomShortUrl = asyncHandler(async (req, res, _next) => {
  const { full_url, custom_url } = req.validatedBody;
  const userId = req.user._id;
  const canonical_url = resolveCanonicalUrl(full_url);

  const short_url = await createCustomShortUrlService(
    canonical_url,
    custom_url,
    userId
  );

  res.json(
    successResponse(SUCCESS_MESSAGES.URL.CUSTOM_CREATED, {
      short_url,
      full_url: canonical_url,
      custom_url: normalizeSlug(custom_url),
      user_authenticated: true,
      created: true,
      reused: false
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

  const updated = await updateOwnedShortUrl(userId, id, updates);

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

export const deleteShortUrl = asyncHandler(async (req, res, next) => {
  const { id } = req.validatedParams;
  const userId = req.user._id;

  const urlToDelete = await short_urlModel.findById(id).lean();

  if (!urlToDelete || urlToDelete.deletedAt) {
    return next(new NotFoundError('URL not found'));
  }

  if (!urlToDelete.user || urlToDelete.user.toString() !== userId.toString()) {
    return next(new AppError('You can only delete your own URLs', 403));
  }

  await short_urlModel.updateOne(
    { _id: id, user: userId },
    { $set: { deletedAt: new Date() } }
  );

  res.json(successResponse(SUCCESS_MESSAGES.URL.DELETED));
});

export const deleteAnonymousShortUrl = asyncHandler(async (req, res, next) => {
  const { id } = req.validatedParams;
  const { manage_token } = req.validatedBody;

  try {
    await deleteAnonymousLinkService(id, manage_token);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return next(error);
    }
    throw error;
  }

  res.json(successResponse(SUCCESS_MESSAGES.URL.DELETED));
});

export const claimAnonymousShortUrls = asyncHandler(async (req, res, _next) => {
  const userId = req.user._id;
  const { links } = req.validatedBody;
  const result = await claimAnonymousLinksService(userId, links);

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

  const urlsToDelete = await short_urlModel
    .find({ _id: { $in: ids }, user: userId, ...activeLinkFilter })
    .select('_id')
    .lean();

  const foundIds = urlsToDelete.map((url) => url._id.toString());
  const skippedIds = ids.filter((id) => !foundIds.includes(id));

  if (foundIds.length === 0) {
    throw new AppError('No matching URLs found to delete', 404, true, {
      skippedIds
    });
  }

  const result = await short_urlModel.updateMany(
    { _id: { $in: foundIds }, user: userId },
    { $set: { deletedAt: new Date() } }
  );

  res.json(
    successResponse(`Deleted ${result.modifiedCount} of ${ids.length} URL(s)`, {
      deletedCount: result.modifiedCount,
      deletedIds: foundIds,
      skippedIds
    })
  );
});

export const getUrlStats = asyncHandler(async (req, res, _next) => {
  const userId = req.user._id;

  const [stats, recentActivity, topUrls, clickStats] = await Promise.all([
    short_urlModel.aggregate([
      { $match: { user: userId, deletedAt: null } },
      {
        $group: {
          _id: null,
          totalUrls: { $sum: 1 },
          totalClicksLifetime: { $sum: '$click' },
          avgClicks: { $avg: '$click' }
        }
      }
    ]),
    short_urlModel.aggregate([
      {
        $match: {
          user: userId,
          deletedAt: null,
          createdAt: {
            $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 },
          clicks: { $sum: '$click' }
        }
      },
      { $sort: { _id: 1 } }
    ]),
    short_urlModel
      .find({ user: userId, ...activeLinkFilter })
      .sort({ click: -1 })
      .limit(5)
      .select('full_url short_url click createdAt')
      .lean(),
    getClickAggregates(userId)
  ]);

  const overallStats = stats[0] || {
    totalUrls: 0,
    totalClicksLifetime: 0,
    avgClicks: 0
  };

  res.json(
    successResponse('URL stats fetched', {
      stats: {
        totalUrls: overallStats.totalUrls,
        totalClicks: overallStats.totalClicksLifetime,
        totalClicksLifetime: overallStats.totalClicksLifetime,
        avgClicksPerUrl: Math.round(overallStats.avgClicks * 100) / 100,
        clickEventRetentionDays: CLICK_RETENTION_DAYS
      },
      recentActivity,
      topUrls,
      clickAnalytics: clickStats
    })
  );
});
