/**
 * Public base URL for short links (redirect host). Prefer PUBLIC_BASE_URL when
 * API and redirect domains differ; otherwise derive from the incoming request.
 */
export function getPublicShortBaseUrl(req) {
  const configured = process.env.PUBLIC_BASE_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, '');
  }

  if (req) {
    const proto = req.get('x-forwarded-proto') || req.protocol || 'https';
    const host = req.get('x-forwarded-host') || req.get('host');
    if (host) {
      return `${proto}://${host}`.replace(/\/$/, '');
    }
  }

  const port = process.env.PORT || 3001;
  return `http://localhost:${port}`;
}

export function buildPublicShortUrl(shortUrlSlug, req) {
  return `${getPublicShortBaseUrl(req)}/${shortUrlSlug}`;
}
