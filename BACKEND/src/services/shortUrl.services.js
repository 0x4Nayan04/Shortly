import short_urlModel from "../schema/shortUrl.model.js";
import { generateNanoId } from "../utlis/helper.js";

export const createShortUrlService = async (url) => {
  const short_url = generateNanoId(7);

  return short_url;
};
