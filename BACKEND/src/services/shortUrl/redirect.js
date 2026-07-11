import { findLinkBySlug } from '../../dao/shortUrl.dao.js';
import { AppError, NotFoundError } from '../../utils/errorHandler.js';
import { normalizeSlug } from '../../utils/normalizeSlug.js';

export async function getShortUrlService(short_url) {
  const slug = normalizeSlug(short_url);
  const shortUrlData = await findLinkBySlug(slug);
  if (!shortUrlData) {
    throw new NotFoundError('Short URL not found');
  }
  if (shortUrlData.retiredAt) {
    throw new AppError('This short link has been retired', 410);
  }
  if (shortUrlData.disabled || !shortUrlData.full_url) {
    throw new NotFoundError('Short URL not found');
  }
  return shortUrlData;
}

export async function resolveRedirectTargetService(short_url) {
  return getShortUrlService(short_url);
}
