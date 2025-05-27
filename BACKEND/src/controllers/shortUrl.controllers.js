import { createShortUrlWithoutUser } from "../services/shortUrl.services.js";

export const createShortUrl = async (req, res) => {
  const { full_url } = req.body;

  if (!full_url) {
    return res.status(400).send("Full URL is required");
  }

  const short_Url = await createShortUrlWithoutUser(full_url);

  res.send({
    short_url: `${process.env.APP_URL}api/${short_Url}`,
  });
};
