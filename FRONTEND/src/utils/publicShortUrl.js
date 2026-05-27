/**
 * Base URL for public short links (display, copy, QR in SPA).
 * Falls back to VITE_APP_URL when API and short-link host are the same.
 */
export function getPublicShortBaseUrl() {
  const configured =
    import.meta.env.VITE_PUBLIC_SHORT_URL?.trim() ||
    import.meta.env.VITE_APP_URL?.trim();
  return configured ? configured.replace(/\/$/, '') : '';
}

export function buildPublicShortUrl(slug) {
  const base = getPublicShortBaseUrl();
  if (!base || !slug) return '';
  return `${base}/${slug}`;
}
