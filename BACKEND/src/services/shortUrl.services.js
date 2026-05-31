import {
  isReservedSlug,
  RESERVED_SLUG_MESSAGE
} from '../constants/reservedSlugs.js';
import { saveShortUrl } from '../dao/shortUrl.dao.js';
import short_urlModel from '../schema/shortUrl.model.js';
import { generateNanoId } from '../utils/helper.js';
import { AppError, NotFoundError } from '../utils/errorHandler.js';

// Helper function to generate a unique short URL
const generateUniqueShortUrl = async () => {
  let short_url;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 5;

  while (!isUnique && attempts < maxAttempts) {
    short_url = generateNanoId(7);

    if (!short_url) {
      throw new AppError('Failed to generate short URL', 500);
    }

    // Use lean() and only check for existence (faster than fetching full document)
    const existingShortUrl = await short_urlModel.exists({ short_url });

    if (!existingShortUrl) {
      isUnique = true;
    }
    attempts++;
  }

  if (!isUnique) {
    throw new AppError(
      'Could not generate unique short URL after multiple attempts',
      500
    );
  }

  return short_url;
};

const findExistingShortUrlForFullUrl = async (full_url, userId) => {
  const query = userId ? { full_url, user: userId } : { full_url, user: null };
  const existing = await short_urlModel
    .findOne(query)
    .select('short_url')
    .lean();
  return existing?.short_url ?? null;
};

const saveShortUrlWithRetry = async (short_url, full_url, userId) => {
  try {
    await saveShortUrl(short_url, full_url, userId);
    return short_url;
  } catch (err) {
    if (err.code !== 11000) {
      throw err;
    }

    const keys = err.keyPattern ? Object.keys(err.keyPattern) : [];
    if (keys.includes('full_url')) {
      const existing = await findExistingShortUrlForFullUrl(full_url, userId);
      if (existing) return existing;
    }

    const fallback = await generateUniqueShortUrl();
    try {
      await saveShortUrl(fallback, full_url, userId);
      return fallback;
    } catch (fallbackErr) {
      if (fallbackErr.code === 11000) {
        const existing = await findExistingShortUrlForFullUrl(full_url, userId);
        if (existing) return existing;
        throw new AppError(
          'Could not generate unique short URL after collision',
          500
        );
      }
      throw fallbackErr;
    }
  }
};

export const createShortUrlWithoutUser = async (full_url) => {
  const short_url = await generateUniqueShortUrl();
  return saveShortUrlWithRetry(short_url, full_url, null);
};

export const createShortUrlWithUser = async (full_url, userId) => {
  const short_url = await generateUniqueShortUrl();
  return saveShortUrlWithRetry(short_url, full_url, userId);
};

export const createCustomShortUrl = async (full_url, custom_url, userId) => {
  if (!custom_url || custom_url.length < 3 || custom_url.length > 20) {
    throw new AppError(
      'Custom URL must be between 3 and 20 characters long.',
      400
    );
  }

  const validPattern = /^[a-zA-Z0-9_-]+$/;
  if (!validPattern.test(custom_url)) {
    throw new AppError(
      'Custom URL can only contain letters, numbers, hyphens, and underscores.',
      400
    );
  }

  if (isReservedSlug(custom_url)) {
    throw new AppError(RESERVED_SLUG_MESSAGE, 400);
  }

  const existingShortUrl = await short_urlModel.exists({
    short_url: custom_url
  });

  if (existingShortUrl) {
    throw new AppError(
      'Custom short URL already exists. Please choose a different one.',
      409
    );
  }

  try {
    await saveShortUrl(custom_url, full_url, userId);
  } catch (err) {
    if (err.code === 11000) {
      const keys = err.keyPattern ? Object.keys(err.keyPattern) : [];
      if (keys.includes('full_url') && keys.includes('user')) {
        throw new AppError('You already have a short link for this URL.', 409);
      }
      throw new AppError(
        'Custom short URL already exists. Please choose a different one.',
        409
      );
    }
    throw err;
  }

  return custom_url;
};

export const getShortUrl = async (short_url) => {
  // Use lean() for better performance - returns plain JS object
  // Only select fields needed for redirect
  const shortUrlData = await short_urlModel
    .findOne({ short_url })
    .select('_id full_url')
    .lean();

  if (!shortUrlData) {
    throw new NotFoundError('Short URL not found');
  }
  return shortUrlData;
};
