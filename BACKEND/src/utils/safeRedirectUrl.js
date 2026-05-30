const SAFE_HTTP_URL = /^https?:\/\//i;

/** Only allow http(s) destinations for public redirects (blocks javascript:, etc.). */
export function isSafeRedirectUrl(url) {
  if (typeof url !== 'string') return false;
  const normalized = url.trim();
  if (!normalized) return false;
  if (!SAFE_HTTP_URL.test(normalized)) return false;
  try {
    const parsed = new URL(normalized);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
