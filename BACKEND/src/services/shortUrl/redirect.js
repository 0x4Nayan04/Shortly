import { findLinkBySlug } from '../../dao/shortUrl.dao.js';
import { AppError, NotFoundError } from '../../utils/errorHandler.js';
import { normalizeSlug } from '../../utils/normalizeSlug.js';
import { readRedirectCache, writeRedirectCache } from './redirectCache.js';

function assertRedirectable(shortUrlData) {
  if (!shortUrlData) {
    throw new NotFoundError('Short URL not found');
  }
  if (shortUrlData.retiredAt) {
    throw new AppError('This short link has been retired', 410);
  }
  if (shortUrlData.disabled) {
    throw new AppError('This short link is disabled', 410);
  }
  if (!shortUrlData.full_url) {
    throw new NotFoundError('Short URL not found');
  }
  return shortUrlData;
}

async function loadRedirectDoc(short_url) {
  const slug = normalizeSlug(short_url);
  const started = Date.now();

  let cacheHit = true;
  let shortUrlData = readRedirectCache(slug);
  if (!shortUrlData) {
    cacheHit = false;
    shortUrlData = await findLinkBySlug(slug);
    if (shortUrlData) writeRedirectCache(slug, shortUrlData);
  }

  return {
    shortUrlData,
    cacheHit,
    lookupMs: Date.now() - started
  };
}

export async function getShortUrlService(short_url) {
  const { shortUrlData } = await loadRedirectDoc(short_url);
  return assertRedirectable(shortUrlData);
}

export async function resolveRedirectTargetService(short_url) {
  const { shortUrlData, cacheHit, lookupMs } = await loadRedirectDoc(short_url);
  return {
    data: assertRedirectable(shortUrlData),
    cacheHit,
    lookupMs
  };
}
