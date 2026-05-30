const RESERVED_SLUGS = new Set([
  'api',
  'v1',
  'health',
  'auth',
  'create',
  'qr',
  'login',
  'register',
  'logout',
  'me',
  'settings',
  'dashboard',
  'privacy',
  'admin',
  'static',
  'assets',
  'reset-password',
  'forgot-password',
  'favicon',
  'robots.txt',
  'sitemap.xml',
  'styles',
  'scripts',
  'images'
]);

export function isReservedSlug(slug) {
  if (!slug) return false;
  return RESERVED_SLUGS.has(String(slug).toLowerCase());
}

export const RESERVED_SLUG_MESSAGE =
  'This short URL is reserved. Please choose a different one.';
