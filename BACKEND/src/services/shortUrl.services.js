import short_urlModel from "../schema/shortUrl.model.js";
import { generateNanoId } from "../utlis/helper.js";

export const createShortUrlService = async (url) => {
  const short_url = generateNanoId(7);

  // Create a new short URL document
  const newShortUrl = new short_urlModel({
    full_url: url,
    short_url,
    click: 0, // Initialize click count to 0
  });

  try {
    // Save the new short URL to the database
    await newShortUrl.save();
    return short_url;
  } catch (error) {
    console.error("Error creating short URL:", error);
    res.status(500).send("Internal Server Error");
  }
};
