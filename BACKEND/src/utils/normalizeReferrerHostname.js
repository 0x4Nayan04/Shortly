const MAX_HOSTNAME_LENGTH = 253;
const SUPPORTED_PROTOCOLS = new Set(['http:', 'https:']);

export function normalizeReferrerHostname(value) {
  if (typeof value !== 'string' || !value.trim()) return '';

  try {
    const parsed = new URL(value.trim());
    if (!SUPPORTED_PROTOCOLS.has(parsed.protocol)) return '';
    const hostname = parsed.hostname.toLowerCase();
    if (!hostname || hostname.length > MAX_HOSTNAME_LENGTH) return '';
    return hostname;
  } catch {
    return '';
  }
}
