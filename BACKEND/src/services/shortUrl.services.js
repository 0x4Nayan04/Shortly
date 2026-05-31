import crypto from 'crypto';
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

const findExistingLinkForCanonical = async (canonical_url, userId) => {
  const query = userId
    ? { canonical_url, user: userId, ...activeLinkFilter }
    : { canonical_url, user: null, ...activeLinkFilter };
  const doc = await short_urlModel
    .findOne(query)
    .sort({ createdAt: 1 })
    .select('_id short_url manage_token')
    .lean();
  if (!doc) return null;
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
        const existing = await findExistingLinkForCanonical(
          canonical_url,
          userId
        );
        if (existing) {
          return existing;
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

export const createShortUrl = async (full_url, userId = null) => {
  const canonical_url = normalizeUrl(full_url);
  const existing = await findExistingLinkForCanonical(canonical_url, userId);
  if (existing) return existing;

  if (userId) await assertUserLinkCapacity(userId);

  const short_url = await generateUniqueShortUrl();
  const manage_token = userId ? null : generateManageToken();
  const saved = await saveShortUrlWithRetry({
    short_url,
    full_url: canonical_url,
    canonical_url,
    userId,
    manage_token
  });

  return manage_token ? { ...saved, manage_token } : saved;
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
    .select('_id full_url')
    .lean();

  if (!shortUrlData) {
    throw new NotFoundError('Short URL not found');
  }

  return shortUrlData;
};

export const claimAnonymousLinks = async (userId, claims) => {
  await assertUserLinkCapacity(userId);

  const results = await Promise.all(
    claims.map(async ({ id, manage_token }) => {
      if (!id || !manage_token) {
        return { type: 'skipped', id, reason: 'missing_id_or_token' };
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
        return { type: 'skipped', id, reason: 'not_found_or_invalid_token' };
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
        return {
          type: 'skipped',
          id,
          reason: 'duplicate_destination',
          short_url: doc.short_url
        };
      }

      await short_urlModel.updateOne(
        { _id: doc._id },
        { $set: { user: userId }, $unset: { manage_token: 1 } }
      );
      return { type: 'claimed', id, short_url: doc.short_url };
    })
  );

  const claimed = results
    .filter((r) => r.type === 'claimed')
    .map(({ type: _type, ...rest }) => rest);
  const skipped = results
    .filter((r) => r.type === 'skipped')
    .map(({ type: _type, ...rest }) => rest);

  return { claimed, skipped };
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
      try {
        validateCustomSlug(nextSlug);
      } catch (err) {
        throw new AppError(err.message, 400);
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
