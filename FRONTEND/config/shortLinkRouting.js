/** SPA routes — must not be proxied to the backend redirect handler. */
export const SPA_SLUGS = new Set([
  'login',
  'register',
  'dashboard',
  'settings',
  'privacy',
  'claim-link',
  'forgot-password',
  'reset-password',
  'verify-email'
]);

/** path-to-regexp segment used in Vercel rewrites for short-link slugs. */
export const SLUG_PATH_PATTERN = '[a-zA-Z0-9_-]{3,20}';

const SLUG_REGEX = new RegExp(`^${SLUG_PATH_PATTERN}$`);

export function isShortLinkPath(pathname) {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length !== 1) return false;
  const slug = parts[0];
  if (SPA_SLUGS.has(slug.toLowerCase())) return false;
  return SLUG_REGEX.test(slug);
}

export function buildVercelRewrites(proxyOrigin) {
  const origin = proxyOrigin.replace(/\/$/, '');
  const spaRewrites = [...SPA_SLUGS].map((slug) => ({
    source: `/${slug}`,
    destination: '/index.html'
  }));

  return [
    ...spaRewrites,
    {
      source: `/:slug(${SLUG_PATH_PATTERN})`,
      destination: `${origin}/:slug`
    },
    { source: '/(.*)', destination: '/index.html' }
  ];
}
