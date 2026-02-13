import short_urlModel from "../schema/shortUrl.model.js";
import {
  createShortUrlWithoutUser,
  createShortUrlWithUser,
  createCustomShortUrl as createCustomShortUrlService,
  getShortUrl,
} from "../services/shortUrl.services.js";

export const createShortUrl = async (req, res) => {
  try {
    const { full_url } = req.body;

    if (!full_url) {
      return res.status(400).json({ message: "Full URL is required" });
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

    res.json({
      short_url: process.env.FRONT_END_URL + "/" + short_url,
      message: "Short URL created successfully",
      success: true,
      full_url: full_url,
      user_authenticated: !!userId,
    });
  } catch (error) {
    console.error("Error creating short URL:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const redirectFromShortUrl = async (req, res) => {
  try {
    const { short_url } = req.params;

    if (!short_url) {
      return res.status(400).send("Short URL is required");
    }

    const shortUrlData = await getShortUrl(short_url);

    // Redirect immediately to the full URL for better performance
    res.redirect(shortUrlData.full_url);

    // Increment the click count asynchronously (don't wait for it)
    // Using updateOne instead of findByIdAndUpdate for slightly better performance
    setImmediate(async () => {
      try {
        await short_urlModel.updateOne(
          { _id: shortUrlData._id },
          { $inc: { click: 1 } }
        );
      } catch (error) {
        console.error("Error updating click count:", error);
        // Don't throw error as redirect already happened
      }
    });
  } catch (error) {
    console.error("Error redirecting:", error);
    res.status(404).send("Short URL not found");
  }
};

export const getUserUrls = async (req, res) => {
  try {
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

    res.json({
      success: true,
      count: userUrls.length,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: Math.floor(skip / limit) + 1,
      hasMore: skip + limit < totalCount,
      urls: userUrls,
    });
  } catch (error) {
    console.error("Error fetching user URLs:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const createCustomShortUrl = async (req, res) => {
  try {
    const { full_url, custom_url } = req.body;

    if (!full_url) {
      return res.status(400).json({ message: "Full URL is required" });
    }

    if (!custom_url) {
      return res.status(400).json({ message: "Custom short URL is required" });
    }

    // This endpoint requires authentication
    const userId = req.user._id;

    // Check if this custom URL already exists - using lean() for performance
    const checkIfCustomUrlExists = await short_urlModel.findOne({
      short_url: custom_url,
    }).lean();

    if (checkIfCustomUrlExists) {
      return res.status(409).json({
        success: false,
        message:
          "Custom short URL already exists. Please choose a different one.",
      });
    }

    // Create custom short URL
    const short_url = await createCustomShortUrlService(
      full_url,
      custom_url,
      userId
    );

    res.json({
      short_url: process.env.FRONT_END_URL + "/" + short_url,
      message: "Custom short URL created successfully",
      success: true,
      full_url: full_url,
      custom_url: custom_url,
      user_authenticated: true,
    });
  } catch (error) {
    console.error("Error creating custom short URL:", error);

    if (
      error.message.includes("already exists") ||
      error.message.includes("must be between") ||
      error.message.includes("can only contain")
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const deleteShortUrl = async (req, res) => {
  try {
    const params = req.validatedParams || req.params;
    const { id } = params;
    const userId = req.user._id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "URL ID is required",
      });
    }

    // Find the URL and verify ownership - using lean() for performance
    const urlToDelete = await short_urlModel.findById(id).lean();

    if (!urlToDelete) {
      return res.status(404).json({
        success: false,
        message: "URL not found",
      });
    }

    // Check if the user owns this URL
    if (urlToDelete.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own URLs",
      });
    }

    // Delete the URL - using deleteOne for slightly better performance
    await short_urlModel.deleteOne({ _id: id });

    res.json({
      success: true,
      message: "URL deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting short URL:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const bulkDeleteUrls = async (req, res) => {
  try {
    const body = req.validatedBody || req.body;
    const { ids } = body;
    const userId = req.user._id;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "An array of URL IDs is required",
      });
    }

    if (ids.length > 50) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete more than 50 URLs at once",
      });
    }

    // Verify all URLs belong to the user before deleting
    const urlsToDelete = await short_urlModel
      .find({ _id: { $in: ids }, user: userId })
      .select("_id")
      .lean();

    const foundIds = urlsToDelete.map((url) => url._id.toString());
    const notFoundOrUnauthorized = ids.filter((id) => !foundIds.includes(id));

    if (notFoundOrUnauthorized.length > 0) {
      return res.status(403).json({
        success: false,
        message: `Some URLs were not found or you don't have permission to delete them`,
        invalidIds: notFoundOrUnauthorized,
      });
    }

    // Delete all URLs that belong to the user
    const result = await short_urlModel.deleteMany({
      _id: { $in: ids },
      user: userId,
    });

    res.json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} URL(s)`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error bulk deleting URLs:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getUrlStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get aggregated statistics for the user's URLs
    const [stats, recentActivity, topUrls] = await Promise.all([
      // Overall stats
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
      // Activity in the last 7 days (URLs created per day)
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
      // Top 5 URLs by clicks
      short_urlModel
        .find({ user: userId })
        .sort({ click: -1 })
        .limit(5)
        .select("full_url short_url click createdAt")
        .lean(),
    ]);

    const overallStats = stats[0] || {
      totalUrls: 0,
      totalClicks: 0,
      avgClicks: 0,
    };

    res.json({
      success: true,
      stats: {
        totalUrls: overallStats.totalUrls,
        totalClicks: overallStats.totalClicks,
        avgClicksPerUrl: Math.round(overallStats.avgClicks * 100) / 100,
      },
      recentActivity,
      topUrls,
    });
  } catch (error) {
    console.error("Error fetching URL stats:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
