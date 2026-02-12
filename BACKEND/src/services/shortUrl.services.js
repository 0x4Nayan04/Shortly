import { saveShortUrl } from "../dao/shortUrl.dao.js";
import short_urlModel from "../schema/shortUrl.model.js";
import { generateNanoId } from "../utils/helper.js";

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
  await saveShortUrl(short_url, full_url, null);
  return short_url;
};

export const createShortUrlWithUser = async (full_url, userId) => {
  const short_url = await generateUniqueShortUrl();
  await saveShortUrl(short_url, full_url, userId);
  return short_url;
};

export const createCustomShortUrl = async (full_url, custom_url, userId) => {
  // Check if the custom URL already exists
  const existingShortUrl = await short_urlModel.findOne({
    short_url: custom_url,
  });

  if (existingShortUrl) {
    throw new Error(
      "Custom short URL already exists. Please choose a different one."
    );
  }

  // Validate custom URL (basic validation)
  if (!custom_url || custom_url.length < 3 || custom_url.length > 20) {
    throw new Error("Custom URL must be between 3 and 20 characters long.");
  }

  // Only allow alphanumeric characters and hyphens/underscores
  const validPattern = /^[a-zA-Z0-9_-]+$/;
  if (!validPattern.test(custom_url)) {
    throw new Error(
      "Custom URL can only contain letters, numbers, hyphens, and underscores."
    );
  }

  await saveShortUrl(custom_url, full_url, userId);
  return custom_url;
};

export const getShortUrl = async (short_url) => {
  const shortUrlData = await short_urlModel.findOne({ short_url });

  if (!shortUrlData) {
    throw new Error("Short URL not found");
  }
  return shortUrlData;
};

export const getCustomShortUrl = async (short_url, userId) => {
  const shortUrlData = await short_urlModel.findOne({
    short_url,
    user: userId,
  });

  if (!shortUrlData) {
    throw new Error("Custom short URL not found for this user");
  }
  return shortUrlData;
};
