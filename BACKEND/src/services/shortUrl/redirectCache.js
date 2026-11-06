const REDIRECT_CACHE_TTL_MS = 10_000;
const REDIRECT_CACHE_MAX = 10_000;

const redirectCache = new Map();

export function invalidateRedirectCache(slug) {
  if (!slug) return;
  redirectCache.delete(String(slug));
}

export function invalidateRedirectCacheMany(slugs = []) {
  for (const slug of slugs) invalidateRedirectCache(slug);
}

export function clearRedirectCache() {
  redirectCache.clear();
}

export function readRedirectCache(slug) {
  const cached = redirectCache.get(slug);
  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    redirectCache.delete(slug);
    return null;
  }
  return { ...cached.value };
}

export function writeRedirectCache(slug, value) {
  if (redirectCache.size >= REDIRECT_CACHE_MAX) {
    redirectCache.delete(redirectCache.keys().next().value);
  }
  redirectCache.set(slug, {
    value: { ...value },
    expiresAt: Date.now() + REDIRECT_CACHE_TTL_MS
  });
}

export const REDIRECT_CACHE_TTL_MS_FOR_TESTS = REDIRECT_CACHE_TTL_MS;
