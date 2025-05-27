import { saveShortUrl } from "../dao/shortUrl.dao.js";
import short_urlModel from "../schema/shortUrl.model.js";
import { generateNanoId } from "../utlis/helper.js";

const short_url = generateNanoId(7);

if (!short_url) {
  throw new Error("Failed to generate short URL");
}

/* const existingShortUrl = await short_urlModel.findOne({ short_url });

if (existingShortUrl) {
  return existingShortUrl.short_url;
} */

export const createShortUrlWithoutUser = async (full_url) => {
  await saveShortUrl(short_url, full_url);

  return short_url;
};
export const createShortUrlWithUser = async (full_url, userId) => {
  await saveShortUrl(short_url, full_url, userId);

  return short_url;
};

export const getShortUrl = async (short_url) => {
  // Find the short URL in the database
  const shortUrlData = await short_urlModel.findOne({ short_url });

  if (!shortUrlData) {
    return res.status(404).send("Short URL not found");
  }
  return shortUrlData;
};
