import { saveShortUrl } from "../dao/shortUrl.dao.js";
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
