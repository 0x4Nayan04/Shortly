import { normalizeSlug } from './normalizeSlug.js';

const TTL_MS = 60_000;
const MAX_ENTRIES = 5000;

/** @type {Map<string, { full_url: string, _id: import('mongoose').Types.ObjectId, expiresAt: number }>} */
const cache = new Map();

export const getCachedRedirectTarget = (short_url) => {
  const slug = normalizeSlug(short_url);
  const entry = cache.get(slug);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(slug);
    return null;
  }
  return { _id: entry._id, full_url: entry.full_url };
};

export const setCachedRedirectTarget = (short_url, data) => {
  const slug = normalizeSlug(short_url);
  if (cache.size >= MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(slug, {
    _id: data._id,
    full_url: data.full_url,
    expiresAt: Date.now() + TTL_MS
  });
};

export const invalidateRedirectSlugCache = (short_url) => {
  if (!short_url) return;
  cache.delete(normalizeSlug(short_url));
};
