import mongoose from 'mongoose';
import short_urlModel from '../schema/shortUrl.model.js';
import {
  createShortUrlWithoutUser,
  createShortUrlWithUser,
  createCustomShortUrl as createCustomShortUrlService,
  getShortUrl
} from '../services/shortUrl.services.js';
import { getClickAggregates } from '../services/analytics.service.js';
import Click from '../schema/click.model.js';
import { AppError, NotFoundError } from '../utils/errorHandler.js';
import asyncHandler from '../utils/asyncHandler.js';
import { getCountryFromRequest } from '../utils/geoip.js';
import { parseUserAgent } from '../utils/userAgent.js';
import {
  SUCCESS_MESSAGES,
  successResponse
} from '../utils/responseMessages.js';
import { escapeRegExp } from '../utils/escapeRegExp.js';
import { logger } from '../utils/logger.js';
import { retryWithBackoff } from '../utils/retry.js';
import { isSafeRedirectUrl } from '../utils/safeRedirectUrl.js';
export const createShortUrl = asyncHandler(async (req, res, _next) => {
  const { full_url } = req.validatedBody;

  const userId = req.user ? req.user._id : null;

  // Check if this URL already exists for this user or globally
  // Using lean() for better performance - returns plain JS object
  let checkIfFullUrlExists;
  if (userId) {
    // If user is authenticated, check if they already have this URL
    checkIfFullUrlExists = await short_urlModel
      .findOne({
        full_url,
        user: userId
      })
      .lean();
  } else {
    // If user is not authenticated, check for global URLs without user
    checkIfFullUrlExists = await short_urlModel
      .findOne({
        full_url,
        user: null
      })
      .lean();
  }

  let short_url;
  if (!checkIfFullUrlExists) {
    // Create new short URL
    if (userId) {
      short_url = await createShortUrlWithUser(full_url, userId);
    } else {
      short_url = await createShortUrlWithoutUser(full_url);
    }
  } else {
    short_url = checkIfFullUrlExists.short_url;
  }

  res.json(
    successResponse(SUCCESS_MESSAGES.URL.CREATED, {
      short_url,
      full_url: full_url,
      user_authenticated: !!userId
    })
  );
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

  // Build base query
  const baseQuery = { user: userId };

  // Add search filter if provided
  if (search && search.trim()) {
    const searchRegex = new RegExp(escapeRegExp(search.trim()), 'i');
    baseQuery.$or = [{ full_url: searchRegex }, { short_url: searchRegex }];
  }

  // Build sort object
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder;

  // Run both queries in parallel for better performance
  const [userUrls, totalCount] = await Promise.all([
    // Get paginated URLs - using lean() for better performance
    short_urlModel
      .find(baseQuery)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .select('full_url short_url click createdAt')
      .lean(),
    // Get total count for pagination
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

  const short_url = await createCustomShortUrlService(
    full_url,
    custom_url,
    userId
  );

  res.json(
    successResponse(SUCCESS_MESSAGES.URL.CUSTOM_CREATED, {
      short_url,
      full_url: full_url,
      custom_url: custom_url,
      user_authenticated: true
    })
  );
});

export const deleteShortUrl = asyncHandler(async (req, res, next) => {
  const { id } = req.validatedParams;
  const userId = req.user._id;

  const urlToDelete = await short_urlModel.findById(id).lean();

  if (!urlToDelete) {
    return next(new NotFoundError('URL not found'));
  }

  // Check if the user owns this URL
  if (!urlToDelete.user || urlToDelete.user.toString() !== userId.toString()) {
    return next(new AppError('You can only delete your own URLs', 403));
  }

  // Delete the URL - using deleteOne for slightly better performance
  await short_urlModel.deleteOne({ _id: id, user: userId });

  await retryWithBackoff(() => Click.deleteMany({ short_url_id: id }), {
    onFinalError: (error) => {
      logger.error('Error cleaning up click records after retries', {
        error: error.message,
        short_url_id: id
      });
    }
  });

  res.json(successResponse(SUCCESS_MESSAGES.URL.DELETED));
});

export const bulkDeleteUrls = asyncHandler(async (req, res, next) => {
  const { ids } = req.validatedBody;
  const userId = req.user._id;

  const urlsToDelete = await short_urlModel
    .find({ _id: { $in: ids }, user: userId })
    .select('_id')
    .lean();

  const foundIds = urlsToDelete.map((url) => url._id.toString());
  const notFoundOrUnauthorized = ids.filter((id) => !foundIds.includes(id));

  if (notFoundOrUnauthorized.length > 0) {
    return next(
      new AppError(
        "Some URLs were not found or you don't have permission to delete them",
        403,
        true,
        { invalidIds: notFoundOrUnauthorized }
      )
    );
  }

  // Delete all URLs that belong to the user
  const result = await short_urlModel.deleteMany({
    _id: { $in: ids },
    user: userId
  });

  await retryWithBackoff(
    () => Click.deleteMany({ short_url_id: { $in: ids } }),
    {
      onFinalError: (error) => {
        logger.error('Error cleaning up click records after retries', {
          error: error.message,
          ids
        });
      }
    }
  );

  res.json(
    successResponse(`Successfully deleted ${result.deletedCount} URL(s)`, {
      deletedCount: result.deletedCount
    })
  );
});

export const getUrlStats = asyncHandler(async (req, res, _next) => {
  const userId = req.user._id;

  const [stats, recentActivity, topUrls, clickStats] = await Promise.all([
    short_urlModel.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          totalUrls: { $sum: 1 },
          totalClicks: { $sum: '$click' },
          avgClicks: { $avg: '$click' }
        }
      }
    ]),
    short_urlModel.aggregate([
      {
        $match: {
          user: userId,
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
      .find({ user: userId })
      .sort({ click: -1 })
      .limit(5)
      .select('full_url short_url click createdAt')
      .lean(),
    getClickAggregates(userId)
  ]);

  const overallStats = stats[0] || {
    totalUrls: 0,
    totalClicks: 0,
    avgClicks: 0
  };

  res.json(
    successResponse('URL stats fetched', {
      stats: {
        totalUrls: overallStats.totalUrls,
        totalClicks: overallStats.totalClicks,
        avgClicksPerUrl: Math.round(overallStats.avgClicks * 100) / 100
      },
      recentActivity,
      topUrls,
      clickAnalytics: clickStats
    })
  );
});
