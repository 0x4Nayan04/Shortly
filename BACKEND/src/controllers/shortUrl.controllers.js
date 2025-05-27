import short_urlModel from "../schema/shortUrl.model.js";
import {
  createShortUrlWithoutUser,
  getShortUrl,
} from "../services/shortUrl.services.js";

export const createShortUrl = async (req, res) => {
  try {
    const { full_url } = req.body;

    if (!full_url) {
      return res.status(400).json({ message: "Full URL is required" });
    }

    const checkIfFullUrlExists = await short_urlModel.findOne({ full_url });

    let short_url;
    if (!checkIfFullUrlExists) {
      short_url = await createShortUrlWithoutUser(full_url);
    } else {
      short_url = checkIfFullUrlExists.short_url;
    }

    res.json({
      short_url: short_url,
      full_url: full_url,
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
