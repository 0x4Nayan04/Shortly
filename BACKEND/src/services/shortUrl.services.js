import crypto from 'crypto';
import {
  isReservedSlug,
  RESERVED_SLUG_MESSAGE
} from '../constants/reservedSlugs.js';
import { MAX_LINKS_PER_USER } from '../constants/shortUrlLimits.js';
import {
  countActiveLinksForUser,
  isSlugAvailable,
  purgeReclaimableSlug,
  saveShortUrl
} from '../dao/shortUrl.dao.js';
import short_urlModel from '../schema/shortUrl.model.js';
import { generateNanoId } from '../utils/helper.js';
import { AppError, NotFoundError } from '../utils/errorHandler.js';
import { normalizeSlug } from '../utils/normalizeSlug.js';
import { normalizeUrl } from '../utils/normalizeUrl.js';
import { validateCustomSlug } from '../utils/validateCustomSlug.js';

const generateManageToken = () => crypto.randomBytes(24).toString('hex');

const activeLinkFilter = { deletedAt: null };

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

    if (await isSlugAvailable(short_url)) {
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

  return normalizeSlug(short_url);
};

const findExistingShortUrlForCanonical = async (canonical_url, userId) => {
  const query = userId
    ? { canonical_url, user: userId, ...activeLinkFilter }
    : { canonical_url, user: null, ...activeLinkFilter };
  const existing = await short_urlModel
    .findOne(query)
    .sort({ createdAt: 1 })
    .select('short_url')
    .lean();
  return existing?.short_url ?? null;
};

const findExistingLinkForCanonical = async (canonical_url, userId) => {
  const short_url = await findExistingShortUrlForCanonical(
    canonical_url,
    userId
  );
  if (!short_url) {
    return null;
  }

  const query = userId
    ? { short_url, user: userId, ...activeLinkFilter }
    : { short_url, user: null, ...activeLinkFilter };
  const doc = await short_urlModel
    .findOne(query)
    .select('_id short_url manage_token')
    .lean();

  if (!doc) {
    return null;
  }

  return {
    short_url: doc.short_url,
    id: doc._id?.toString(),
    manage_token: doc.manage_token ?? undefined,
    created: false,
    reused: true
  };
};

const assertUserLinkCapacity = async (userId) => {
  if (!userId) return;
  const count = await countActiveLinksForUser(userId);
  if (count >= MAX_LINKS_PER_USER) {
    throw new AppError(
      `Link limit reached (${MAX_LINKS_PER_USER}). Delete unused links to create more.`,
      403
    );
  }
};

const saveShortUrlWithRetry = async ({
  short_url,
  full_url,
  canonical_url,
  userId,
  manage_token = null
}) => {
  await purgeReclaimableSlug(short_url);

  try {
    const saved = await saveShortUrl({
      short_url,
      full_url,
      canonical_url,
      user_Id: userId,
      manage_token
    });
    return { ...saved, created: true, reused: false };
  } catch (err) {
    if (err.code !== 11000) {
      throw err;
    }

    const keys = err.keyPattern ? Object.keys(err.keyPattern) : [];
    if (keys.includes('short_url')) {
      if (userId) {
        const existing = await findExistingShortUrlForCanonical(
          canonical_url,
          userId
        );
        if (existing) {
          const doc = await short_urlModel
            .findOne({
              short_url: existing,
              user: userId,
              deletedAt: null
            })
            .select('_id short_url')
            .lean();
          return {
            short_url: existing,
            id: doc?._id?.toString(),
            created: false,
            reused: true
          };
        }
      }
      const fallback = await generateUniqueShortUrl();
      return saveShortUrlWithRetry({
        short_url: fallback,
        full_url,
        canonical_url,
        userId,
        manage_token
      });
    }

    throw err;
  }
};

export const createShortUrlWithoutUser = async (full_url) => {
  const canonical_url = normalizeUrl(full_url);
  const existing = await findExistingLinkForCanonical(canonical_url, null);
  if (existing) {
    return existing;
  }

  const short_url = await generateUniqueShortUrl();
  const manage_token = generateManageToken();
  const saved = await saveShortUrlWithRetry({
    short_url,
    full_url: canonical_url,
    canonical_url,
    userId: null,
    manage_token
  });
  return { ...saved, manage_token };
};

export const createShortUrlWithUser = async (full_url, userId) => {
  const canonical_url = normalizeUrl(full_url);
  const existing = await findExistingLinkForCanonical(canonical_url, userId);
  if (existing) {
    return existing;
  }

  await assertUserLinkCapacity(userId);
  const short_url = await generateUniqueShortUrl();
  return saveShortUrlWithRetry({
    short_url,
    full_url: canonical_url,
    canonical_url,
    userId
  });
};

export const createCustomShortUrl = async (full_url, custom_url, userId) => {
  await assertUserLinkCapacity(userId);

  const canonical_url = normalizeUrl(full_url);
  let slug;
  try {
    slug = validateCustomSlug(custom_url);
  } catch (err) {
    throw new AppError(err.message, 400);
  }

  if (!(await isSlugAvailable(slug))) {
    throw new AppError(
      'Custom short URL already exists. Please choose a different one.',
      409
    );
  }

  await purgeReclaimableSlug(slug);

  try {
    await saveShortUrl({
      short_url: slug,
      full_url: canonical_url,
      canonical_url,
      user_Id: userId
    });
  } catch (err) {
    if (err.code === 11000) {
      throw new AppError(
        'Custom short URL already exists. Please choose a different one.',
        409
      );
    }
    throw err;
  }

  return slug;
};

export const getShortUrl = async (short_url) => {
  const slug = normalizeSlug(short_url);
  const shortUrlData = await short_urlModel
    .findOne({
      short_url: slug,
      deletedAt: null,
      disabled: { $ne: true }
    })
    .select('_id full_url disabled')
    .lean();

  if (!shortUrlData) {
    throw new NotFoundError('Short URL not found');
  }

  if (shortUrlData.disabled) {
    throw new AppError('This short link has been disabled', 410);
  }

  return shortUrlData;
};

export const claimAnonymousLinks = async (userId, claims) => {
  await assertUserLinkCapacity(userId);

  const claimed = [];
  const skipped = [];

  for (const { id, manage_token } of claims) {
    if (!id || !manage_token) {
      skipped.push({ id, reason: 'missing_id_or_token' });
      continue;
    }

    const doc = await short_urlModel
      .findOne({
        _id: id,
        user: null,
        deletedAt: null,
        manage_token
      })
      .select('_id short_url canonical_url')
      .lean();

    if (!doc) {
      skipped.push({ id, reason: 'not_found_or_invalid_token' });
      continue;
    }

    const ownedDuplicate = await short_urlModel.exists({
      user: userId,
      canonical_url: doc.canonical_url,
      deletedAt: null
    });

    if (ownedDuplicate) {
      await short_urlModel.updateOne(
        { _id: doc._id },
        { $set: { deletedAt: new Date() } }
      );
      skipped.push({
        id,
        reason: 'duplicate_destination',
        short_url: doc.short_url
      });
      continue;
    }

    await short_urlModel.updateOne(
      { _id: doc._id },
      { $set: { user: userId }, $unset: { manage_token: 1 } }
    );
    claimed.push({ id, short_url: doc.short_url });
  }

  return { claimed, skipped };
};

export const deleteAnonymousLink = async (id, manage_token) => {
  const result = await short_urlModel.updateOne(
    {
      _id: id,
      user: null,
      deletedAt: null,
      manage_token
    },
    { $set: { deletedAt: new Date() } }
  );

  if (result.modifiedCount === 0) {
    throw new NotFoundError('Anonymous link not found');
  }
};

export const updateOwnedShortUrl = async (userId, id, updates) => {
  const url = await short_urlModel
    .findById(id)
    .select('user short_url deletedAt')
    .lean();

  if (!url || url.deletedAt) {
    throw new NotFoundError('URL not found');
  }

  if (!url.user || url.user.toString() !== userId.toString()) {
    throw new AppError('You can only update your own URLs', 403);
  }

  const patch = {};

  if (updates.full_url !== undefined) {
    const canonical_url = normalizeUrl(updates.full_url);
    patch.full_url = canonical_url;
    patch.canonical_url = canonical_url;
  }

  if (updates.disabled !== undefined) {
    patch.disabled = updates.disabled;
  }

  if (updates.short_url !== undefined) {
    const nextSlug = normalizeSlug(updates.short_url);
    if (nextSlug !== url.short_url) {
      if (!nextSlug || nextSlug.length < 3 || nextSlug.length > 20) {
        throw new AppError(
          'Custom URL must be between 3 and 20 characters long.',
          400
        );
      }
      if (!/^[a-z0-9_-]+$/.test(nextSlug)) {
        throw new AppError(
          'Custom URL can only contain letters, numbers, hyphens, and underscores.',
          400
        );
      }
      if (isReservedSlug(nextSlug)) {
        throw new AppError(RESERVED_SLUG_MESSAGE, 400);
      }
      if (!(await isSlugAvailable(nextSlug))) {
        throw new AppError(
          'Custom short URL already exists. Please choose a different one.',
          409
        );
      }
      await purgeReclaimableSlug(nextSlug);
      patch.short_url = nextSlug;
    }
  }

  if (Object.keys(patch).length === 0) {
    return short_urlModel.findById(id).lean();
  }

  try {
    await short_urlModel.updateOne({ _id: id, user: userId }, { $set: patch });
  } catch (err) {
    if (err.code === 11000) {
      throw new AppError(
        'Custom short URL already exists. Please choose a different one.',
        409
      );
    }
    throw err;
  }

  return short_urlModel.findById(id).lean();
};

export { normalizeUrl };
