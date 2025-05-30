import short_urlModel from "../schema/shortUrl.model.js";

export const saveShortUrl = async (short_url, long_url, user_Id) => {
  // Create a new short URL document
  const newShortUrl = new short_urlModel({
    full_url: long_url,
    short_url: short_url,
    click: 0, // Initialize click count to 0
  });
  if (user_Id) {
    newShortUrl.user_Id = user_Id; // Associate the short URL with a user if provided
  }
  // Save the new short URL to the database
  await newShortUrl.save();
  return newShortUrl;
};
