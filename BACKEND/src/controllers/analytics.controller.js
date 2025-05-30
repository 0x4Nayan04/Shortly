import ClickAnalytics from "../schema/clickAnalytics.model.js";
import short_urlModel from "../schema/shortUrl.model.js";
import UAParser from "ua-parser-js";

// Record a click with detailed analytics
export const recordClick = async (shortUrlId, req) => {
  try {
    const parser = new UAParser(req.headers["user-agent"]);
    const result = parser.getResult();

    const clickData = {
      shortUrl: shortUrlId,
      ipAddress: req.ip || req.connection.remoteAddress || "unknown",
      userAgent: req.headers["user-agent"] || "unknown",
      referer: req.headers.referer || "Direct",
      device: result.device.type || "desktop",
      browser: result.browser.name || "Unknown",
      os: result.os.name || "Unknown",
      // Note: For geographic data, you'd typically use a service like MaxMind GeoIP
      // For now, we'll use placeholder values
      country: "Unknown",
      city: "Unknown",
    };

    const clickAnalytics = new ClickAnalytics(clickData);
    await clickAnalytics.save();

    return clickAnalytics;
  } catch (error) {
    console.error("Error recording click analytics:", error);
    // Don't throw error to avoid breaking the redirect functionality
    return null;
  }
};

// Get analytics for a specific URL
export const getUrlAnalytics = async (req, res) => {
  try {
    const { urlId } = req.params;
    const userId = req.user._id;

    // Verify that the URL belongs to the user
    const shortUrl = await short_urlModel.findOne({
      _id: urlId,
      user: userId,
    });

    if (!shortUrl) {
      return res.status(404).json({
        success: false,
        message:
          "URL not found or you don't have permission to view its analytics",
      });
    }

    // Get analytics data
    const analytics = await ClickAnalytics.find({ shortUrl: urlId })
      .sort({ createdAt: -1 })
      .limit(1000); // Limit to recent 1000 clicks

    // Aggregate data for charts
    const totalClicks = analytics.length;

    // Clicks by date (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const clicksByDate = await ClickAnalytics.aggregate([
      {
        $match: {
          shortUrl: shortUrl._id,
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Clicks by browser
    const clicksByBrowser = await ClickAnalytics.aggregate([
      { $match: { shortUrl: shortUrl._id } },
      {
        $group: {
          _id: "$browser",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Clicks by device
    const clicksByDevice = await ClickAnalytics.aggregate([
      { $match: { shortUrl: shortUrl._id } },
      {
        $group: {
          _id: "$device",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Clicks by OS
    const clicksByOS = await ClickAnalytics.aggregate([
      { $match: { shortUrl: shortUrl._id } },
      {
        $group: {
          _id: "$os",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Top referrers
    const topReferrers = await ClickAnalytics.aggregate([
      { $match: { shortUrl: shortUrl._id } },
      {
        $group: {
          _id: "$referer",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Recent clicks (last 100)
    const recentClicks = await ClickAnalytics.find({ shortUrl: urlId })
      .sort({ createdAt: -1 })
      .limit(100)
      .select("createdAt browser os device referer country city");

    res.json({
      success: true,
      analytics: {
        url: {
          id: shortUrl._id,
          shortUrl: shortUrl.short_url,
          fullUrl: shortUrl.full_url,
          totalClicks: shortUrl.click,
          createdAt: shortUrl.createdAt,
          title: shortUrl.title,
          description: shortUrl.description,
        },
        totalClicks,
        clicksByDate,
        clicksByBrowser,
        clicksByDevice,
        clicksByOS,
        topReferrers,
        recentClicks,
      },
    });
  } catch (error) {
    console.error("Error fetching URL analytics:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get dashboard analytics for user
export const getDashboardAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all user URLs
    const userUrls = await short_urlModel.find({ user: userId });
    const urlIds = userUrls.map((url) => url._id);

    if (urlIds.length === 0) {
      return res.json({
        success: true,
        analytics: {
          totalUrls: 0,
          totalClicks: 0,
          clicksToday: 0,
          clicksThisWeek: 0,
          clicksByDate: [],
          topPerformingUrls: [],
          clicksByBrowser: [],
          clicksByDevice: [],
        },
      });
    }

    // Calculate date ranges
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Total clicks today
    const clicksToday = await ClickAnalytics.countDocuments({
      shortUrl: { $in: urlIds },
      createdAt: { $gte: today },
    });

    // Total clicks this week
    const clicksThisWeek = await ClickAnalytics.countDocuments({
      shortUrl: { $in: urlIds },
      createdAt: { $gte: weekAgo },
    });

    // Total clicks overall
    const totalClicks = userUrls.reduce((sum, url) => sum + url.click, 0);

    // Clicks by date (last 30 days)
    const clicksByDate = await ClickAnalytics.aggregate([
      {
        $match: {
          shortUrl: { $in: urlIds },
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Top performing URLs
    const topPerformingUrls = userUrls
      .sort((a, b) => b.click - a.click)
      .slice(0, 5)
      .map((url) => ({
        id: url._id,
        shortUrl: url.short_url,
        fullUrl: url.full_url,
        clicks: url.click,
        title: url.title || url.full_url,
      }));

    // Clicks by browser
    const clicksByBrowser = await ClickAnalytics.aggregate([
      { $match: { shortUrl: { $in: urlIds } } },
      {
        $group: {
          _id: "$browser",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    // Clicks by device
    const clicksByDevice = await ClickAnalytics.aggregate([
      { $match: { shortUrl: { $in: urlIds } } },
      {
        $group: {
          _id: "$device",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json({
      success: true,
      analytics: {
        totalUrls: userUrls.length,
        totalClicks,
        clicksToday,
        clicksThisWeek,
        clicksByDate,
        topPerformingUrls,
        clicksByBrowser,
        clicksByDevice,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard analytics:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
