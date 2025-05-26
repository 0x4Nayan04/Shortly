import short_urlModel from "../schema/shortUrl.model";

export const saveShortUrl = async () => {
  // Create a new short URL document
  const newShortUrl = new short_urlModel({
    full_url: url,
    short_url: short_url,
    click: 0, // Initialize click count to 0
  });

  // Save the new short URL to the database
  await newShortUrl.save();
};
