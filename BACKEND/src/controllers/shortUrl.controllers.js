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
    let checkIfFullUrlExists;
    if (userId) {
      // If user is authenticated, check if they already have this URL
      checkIfFullUrlExists = await short_urlModel.findOne({
        full_url,
        user: userId,
      });
    } else {
      // If user is not authenticated, check for global URLs without user
      checkIfFullUrlExists = await short_urlModel.findOne({
        full_url,
        user: { $exists: false },
      });
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
    setImmediate(async () => {
      try {
        await short_urlModel.findByIdAndUpdate(
          shortUrlData._id,
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
    const limit = parseInt(req.query.limit) || 20; // Default 20 URLs per page
    const skip = parseInt(req.query.skip) || 0;

    // Get paginated URLs created by the authenticated user
    const userUrls = await short_urlModel
      .find({ user: userId })
      .sort({ createdAt: -1 }) // Sort by newest first
      .skip(skip)
      .limit(limit)
      .select("full_url short_url click createdAt ");

    // Get total count for pagination info
    const totalCount = await short_urlModel.countDocuments({ user: userId });

    console.log(`Found ${userUrls.length} URLs for user (page ${Math.floor(skip / limit) + 1})`);

    res.json({
      success: true,
      count: userUrls.length,
      totalCount,
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
    console.log("Creating custom URL for user:", userId);

    // Check if this custom URL already exists for this user
    const checkIfCustomUrlExists = await short_urlModel.findOne({
      short_url: custom_url,
    });

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
    const { id } = req.params;
    const userId = req.user._id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "URL ID is required",
      });
    }

    // Find the URL and verify ownership
    const urlToDelete = await short_urlModel.findById(id);

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

    // Delete the URL
    await short_urlModel.findByIdAndDelete(id);

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
