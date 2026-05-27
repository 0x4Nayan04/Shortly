import short_urlModel from "../schema/shortUrl.model.js";
import {
  createShortUrlWithoutUser,
  createShortUrlWithUser,
  createCustomShortUrl as createCustomShortUrlService,
  getShortUrl,
} from "../services/shortUrl.services.js";
import { getClickAggregates } from "../services/analytics.service.js";
import Click from "../schema/click.model.js";
import { AppError, NotFoundError } from "../utils/errorHandler.js";
import asyncHandler from "../utils/asyncHandler.js";
import { getCountryFromRequest } from "../utils/geoip.js";
import { parseUserAgent } from "../utils/userAgent.js";
import { SUCCESS_MESSAGES, successResponse } from "../utils/responseMessages.js";
export const createShortUrl = asyncHandler(async (req, res, next) => {
  const { full_url } = req.body;

  if (!full_url) {
    return next(new AppError("Full URL is required", 400));
  }

  const userId = req.user ? req.user._id : null;

  // Check if this URL already exists for this user or globally
  // Using lean() for better performance - returns plain JS object
  let checkIfFullUrlExists;
  if (userId) {
    // If user is authenticated, check if they already have this URL
    checkIfFullUrlExists = await short_urlModel.findOne({
      full_url,
      user: userId,
    }).lean();
  } else {
    // If user is not authenticated, check for global URLs without user
    checkIfFullUrlExists = await short_urlModel.findOne({
      full_url,
      user: { $exists: false },
    }).lean();
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

  res.json(successResponse(SUCCESS_MESSAGES.URL.CREATED, {
    short_url,
    full_url: full_url,
    user_authenticated: !!userId,
  }));
});

export const redirectFromShortUrl = asyncHandler(async (req, res, next) => {
  const { short_url } = req.params;

  if (!short_url) {
    return next(new AppError("Short URL is required", 400));
  }

  const shortUrlData = await getShortUrl(short_url).catch((error) => {
    if (error.message === "Short URL not found") {
      throw new NotFoundError("Short URL not found");
    }

    throw error;
  });

  // Redirect immediately to the full URL for better performance
  res.redirect(shortUrlData.full_url);

  // Increment the click count asynchronously (don't wait for it)
  // Using updateOne instead of findByIdAndUpdate for slightly better performance
  const referrer = req.get("referer") || req.get("referrer") || "";
  const country = getCountryFromRequest(req);
  const { user_agent, device_type, browser, os } = parseUserAgent(req);

  setImmediate(() => {
    short_urlModel
      .updateOne({ _id: shortUrlData._id }, { $inc: { click: 1 } })
      .catch((error) => {
        console.error("Error updating click count:", error);
      });

    Click.create({
      short_url_id: shortUrlData._id,
      referrer,
      country,
      user_agent,
      device_type,
      browser,
      os,
      timestamp: new Date(),
    }).catch((error) => {
      console.error("Error saving click analytics:", error);
    });
  });
});

export const getUserUrls = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const query = req.validatedQuery || req.query;
  const limit = parseInt(query.limit) || 20;
  const skip = parseInt(query.skip) || 0;
  const search = query.search || "";
  const sortBy = query.sortBy || "createdAt";
  const sortOrder = query.sortOrder === "asc" ? 1 : -1;

  // Build base query
  const baseQuery = { user: userId };

  // Add search filter if provided
  if (search.trim()) {
    const searchRegex = new RegExp(search.trim(), "i");
    baseQuery.$or = [
      { full_url: searchRegex },
      { short_url: searchRegex },
    ];
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
      .select("full_url short_url click createdAt")
      .lean(),
    // Get total count for pagination
    short_urlModel.countDocuments(baseQuery)
  ]);

  res.json(successResponse("User URLs fetched", {
    count: userUrls.length,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: Math.floor(skip / limit) + 1,
    hasMore: skip + limit < totalCount,
    urls: userUrls,
  }));
});

export const createCustomShortUrl = asyncHandler(async (req, res, next) => {
  const { full_url, custom_url } = req.body;

  if (!full_url) {
    return next(new AppError("Full URL is required", 400));
  }

  if (!custom_url) {
    return next(new AppError("Custom short URL is required", 400));
  }

  // This endpoint requires authentication
  const userId = req.user._id;

  // Check if this custom URL already exists - using lean() for performance
  const checkIfCustomUrlExists = await short_urlModel.findOne({
    short_url: custom_url,
  }).lean();

  if (checkIfCustomUrlExists) {
    return next(new AppError(
      "Custom short URL already exists. Please choose a different one.",
      409
    ));
  }

  const short_url = await createCustomShortUrlService(
    full_url,
    custom_url,
    userId
  ).catch((error) => {
    if (
      error.message.includes("already exists") ||
      error.message.includes("must be between") ||
      error.message.includes("can only contain")
    ) {
      throw new AppError(error.message, 400);
    }

    throw error;
  });

  res.json(successResponse(SUCCESS_MESSAGES.URL.CUSTOM_CREATED, {
    short_url,
    full_url: full_url,
    custom_url: custom_url,
    user_authenticated: true,
  }));
});

export const deleteShortUrl = asyncHandler(async (req, res, next) => {
  const params = req.validatedParams || req.params;
  const { id } = params;
  const userId = req.user._id;

  if (!id) {
    return next(new AppError("URL ID is required", 400));
  }

  // Find the URL and verify ownership - using lean() for performance
  const urlToDelete = await short_urlModel.findById(id).lean();

  if (!urlToDelete) {
    return next(new NotFoundError("URL not found"));
  }

  // Check if the user owns this URL
  if (urlToDelete.user.toString() !== userId.toString()) {
    return next(new AppError("You can only delete your own URLs", 403));
  }

  // Delete the URL - using deleteOne for slightly better performance
  await short_urlModel.deleteOne({ _id: id });

  res.json(successResponse(SUCCESS_MESSAGES.URL.DELETED));
});

export const bulkDeleteUrls = asyncHandler(async (req, res, next) => {
  const body = req.validatedBody || req.body;
  const { ids } = body;
  const userId = req.user._id;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return next(new AppError("An array of URL IDs is required", 400));
  }

  if (ids.length > 50) {
    return next(new AppError("Cannot delete more than 50 URLs at once", 400));
  }

  // Verify all URLs belong to the user before deleting
  const urlsToDelete = await short_urlModel
    .find({ _id: { $in: ids }, user: userId })
    .select("_id")
    .lean();

  const foundIds = urlsToDelete.map((url) => url._id.toString());
  const notFoundOrUnauthorized = ids.filter((id) => !foundIds.includes(id));

  if (notFoundOrUnauthorized.length > 0) {
    return next(new AppError(
      "Some URLs were not found or you don't have permission to delete them",
      403,
      true,
      { invalidIds: notFoundOrUnauthorized }
    ));
  }

  // Delete all URLs that belong to the user
  const result = await short_urlModel.deleteMany({
    _id: { $in: ids },
    user: userId,
  });

  res.json(successResponse(
    `Successfully deleted ${result.deletedCount} URL(s)`,
    { deletedCount: result.deletedCount }
  ));
});

export const getUrlStats = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;

  const [stats, recentActivity, topUrls, clickStats] = await Promise.all([
    short_urlModel.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          totalUrls: { $sum: 1 },
          totalClicks: { $sum: "$click" },
          avgClicks: { $avg: "$click" },
        },
      },
    ]),
    short_urlModel.aggregate([
      {
        $match: {
          user: userId,
          createdAt: {
            $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
          clicks: { $sum: "$click" },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    short_urlModel
      .find({ user: userId })
      .sort({ click: -1 })
      .limit(5)
      .select("full_url short_url click createdAt")
      .lean(),
    getClickAggregates(userId),
  ]);

  const overallStats = stats[0] || {
    totalUrls: 0,
    totalClicks: 0,
    avgClicks: 0,
  };

  res.json(successResponse("URL stats fetched", {
    stats: {
      totalUrls: overallStats.totalUrls,
      totalClicks: overallStats.totalClicks,
      avgClicksPerUrl: Math.round(overallStats.avgClicks * 100) / 100,
    },
    recentActivity,
    topUrls,
    clickAnalytics: clickStats,
  }));
});

