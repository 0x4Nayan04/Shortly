import {
  createShortUrlWithoutUser,
  getShortUrl,
} from "../services/shortUrl.services.js";

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

export const redirectFromShortUrl = async (req, res) => {
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
};
