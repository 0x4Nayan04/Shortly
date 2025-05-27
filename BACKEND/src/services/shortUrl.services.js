import { saveShortUrl } from "../dao/shortUrl.dao.js";
import short_urlModel from "../schema/shortUrl.model.js";
import { generateNanoId } from "../utlis/helper.js";

// Helper function to generate a unique short URL
const generateUniqueShortUrl = async () => {
  let short_url;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 5;

  while (!isUnique && attempts < maxAttempts) {
    short_url = generateNanoId(7);

    if (!short_url) {
      throw new Error("Failed to generate short URL");
    }

    const existingShortUrl = await short_urlModel.findOne({ short_url });

    if (!existingShortUrl) {
      isUnique = true;
    }
    attempts++;
  }

  if (!isUnique) {
    throw new Error(
      "Could not generate unique short URL after multiple attempts"
    );
  }

  return short_url;
};

export const createShortUrlWithoutUser = async (full_url) => {
  const short_url = await generateUniqueShortUrl();
  await saveShortUrl(short_url, full_url);
  return short_url;
};

export const createShortUrlWithUser = async (full_url, userId) => {
  const short_url = await generateUniqueShortUrl();
  await saveShortUrl(short_url, full_url, userId);
  return short_url;
};

export const getShortUrl = async (short_url) => {
  const shortUrlData = await short_urlModel.findOne({ short_url });

  if (!shortUrlData) {
    throw new Error("Short URL not found");
  }
  return shortUrlData;
};
