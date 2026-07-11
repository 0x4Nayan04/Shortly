import {
  findExistingForCanonical,
  isSlugAvailable,
  saveShortUrl
} from '../../dao/shortUrl.dao.js';
import { generateNanoId } from '../../utils/helper.js';
import { AppError } from '../../utils/errorHandler.js';
import { normalizeSlug } from '../../utils/normalizeSlug.js';

const MAX_DUPLICATE_SAVE_ATTEMPTS = 5;
const MAX_SLUG_GENERATION_ATTEMPTS = 5;

export const buildExistingReuseResult = (doc) => ({
  short_url: doc.short_url,
  id: doc._id?.toString(),
  created: false,
  reused: true
});

export const generateUniqueShortUrl = async () => {
  for (let attempt = 0; attempt < MAX_SLUG_GENERATION_ATTEMPTS; attempt++) {
    const short_url = normalizeSlug(generateNanoId(7));
    if (await isSlugAvailable(short_url)) return short_url;
  }

  throw new AppError(
    'Could not generate unique short URL after multiple attempts',
    500
  );
};

/**
 * Saves a short URL; on global slug collision, retries with a newly generated slug.
 */
export const saveShortUrlOnDuplicateSlug = async (
  {
    short_url,
    full_url,
    canonical_url,
    userId,
    manage_token = null,
    session = null
  },
  attempt = 1
) => {
  try {
    const saved = await saveShortUrl({
      short_url,
      full_url,
      canonical_url,
      userId,
      manage_token,
      session
    });
    return { ...saved, created: true, reused: false };
  } catch (err) {
    if (err.code !== 11000) throw err;

    const keys = err.keyPattern ? Object.keys(err.keyPattern) : [];
    if (!keys.includes('short_url')) throw err;

    if (userId) {
      const doc = await findExistingForCanonical(canonical_url, userId);
      if (doc) return buildExistingReuseResult(doc);
    }

    if (attempt >= MAX_DUPLICATE_SAVE_ATTEMPTS) {
      throw new AppError(
        'Could not save short URL after multiple duplicate slug attempts',
        500
      );
    }

    const fallback = await generateUniqueShortUrl();
    return saveShortUrlOnDuplicateSlug(
      {
        short_url: fallback,
        full_url,
        canonical_url,
        userId,
        manage_token,
        session
      },
      attempt + 1
    );
  }
};
