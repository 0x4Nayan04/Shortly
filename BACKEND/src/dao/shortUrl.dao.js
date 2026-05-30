import short_urlModel from "../schema/shortUrl.model.js";

export const saveShortUrl = async (short_url, long_url, user_Id) => {
  const doc = { full_url: long_url, short_url, click: 0 };

  if (user_Id) {
    doc.user = user_Id;
  }

  await short_urlModel.create(doc);
  return { short_url };
};
