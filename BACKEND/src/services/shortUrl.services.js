import { saveShortUrl } from "../dao/shortUrl.dao.js";
import short_urlModel from "../schema/shortUrl.model.js";
import { generateNanoId } from "../utlis/helper.js";

export const createShortUrlWithoutUser = async (full_url) => {
  const short_url = generateNanoId(7);
  await saveShortUrl(short_url, full_url);

  return short_url;
};
export const createShortUrlWithUser = async (full_url, userId) => {
  const short_url = generateNanoId(7);
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
