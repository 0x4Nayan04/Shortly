import { findActiveLinkBySlug } from '../../dao/shortUrl.dao.js';
import { NotFoundError } from '../../utils/errorHandler.js';
import { normalizeSlug } from '../../utils/normalizeSlug.js';
import {
  getCachedRedirectTarget,
  setCachedRedirectTarget
} from '../../utils/redirectSlugCache.js';

export async function getShortUrlService(short_url) {
  const slug = normalizeSlug(short_url);
  const shortUrlData = await findActiveLinkBySlug(slug);
  if (!shortUrlData) {
    throw new NotFoundError('Short URL not found');
  }
  return shortUrlData;
}

export async function resolveRedirectTargetService(short_url) {
  const cached = getCachedRedirectTarget(short_url);
  if (cached) return cached;

  const shortUrlData = await getShortUrlService(short_url);
  setCachedRedirectTarget(short_url, shortUrlData);
  return shortUrlData;
}
