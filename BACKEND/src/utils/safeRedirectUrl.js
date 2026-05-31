const SAFE_HTTP_URL = /^https?:\/\//i;

function isPrivateOrLocalHost(hostname) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (host === 'localhost' || host.endsWith('.localhost')) {
    return true;
  }
  if (host === '::1') return true;
  const parts = host.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) {
    return false;
  }
  const [a, b] = parts;
  if (a === 127 || a === 10 || a === 0) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 169 && b === 254) return true;
  return false;
}

/** Only allow http(s) destinations for public redirects (blocks javascript:, etc.). */
export function isSafeRedirectUrl(url) {
  if (typeof url !== 'string') return false;
  const normalized = url.trim();
  if (!normalized) return false;
  if (!SAFE_HTTP_URL.test(normalized)) return false;
  try {
    const parsed = new URL(normalized);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    return !isPrivateOrLocalHost(parsed.hostname);
  } catch {
    return false;
  }
}
