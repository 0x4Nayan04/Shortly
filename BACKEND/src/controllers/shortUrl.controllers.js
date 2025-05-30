import short_urlModel from "../schema/shortUrl.model.js";
import {
  createShortUrlWithoutUser,
  createShortUrlWithUser,
  getShortUrl,
} from "../services/shortUrl.services.js";

export const createShortUrl = async (req, res) => {
  try {
    const { full_url } = req.body;

    if (!full_url) {
      return res.status(400).json({ message: "Full URL is required" });
    }

    // Check if user is authenticated (from optionalAuth middleware)
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
      short_url: short_url,
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

    // Increment the click count
    shortUrlData.click += 1;
    await shortUrlData.save();

    // Redirect to the full URL
    res.redirect(shortUrlData.full_url);
  } catch (error) {
    console.error("Error redirecting:", error);
    res.status(404).send("Short URL not found");
  }
};

export const getUserUrls = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all URLs created by the authenticated user
    const userUrls = await short_urlModel
      .find({ user: userId })
      .sort({ createdAt: -1 }) // Sort by newest first
      .select("full_url short_url click createdAt"); // Only select necessary fields

    res.json({
      success: true,
      count: userUrls.length,
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
