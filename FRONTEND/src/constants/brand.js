/** Brand assets, document metadata, and route titles */

export const SHORTLY_SITE_NAME = 'Shortly';

export const SHORTLY_DEFAULT_TITLE = 'Shortly · Short links & analytics';

export const SHORTLY_META_DESCRIPTION =
  'Shortly is a privacy-first URL shortener. Shorten links instantly, use custom aliases, and get click analytics without storing visitor IP addresses or tracking cookies.';

export const SHORTLY_OG_IMAGE = '/og-image.png';
export const SHORTLY_OG_IMAGE_WIDTH = 1200;
export const SHORTLY_OG_IMAGE_HEIGHT = 630;

/** Production canonical origin; dev falls back to window.location.origin in useDocumentMeta */
export const SHORTLY_SITE_URL = 'https://shortly.nayan04.me';

export const SHORTLY_LOGO_SRC = '/assets/Shortly_Logo_nav.png';
export const SHORTLY_LOGO_HOVER_SRC = '/assets/Shortly_Logo_nav_hover.png';
export const SHORTLY_LOGO_MARK_SRC = '/assets/Shortly_Logo_mark.png';
export const SHORTLY_LOGO_ALT = 'Shortly';

/** @param {string} pageTitle e.g. "Dashboard" */
export const formatPageTitle = (pageTitle) =>
  `${pageTitle} · ${SHORTLY_SITE_NAME}`;

const ROUTE_PAGE_TITLES = {
  '/': SHORTLY_DEFAULT_TITLE,
  '/login': formatPageTitle('Sign in'),
  '/register': formatPageTitle('Create account'),
  '/dashboard': formatPageTitle('Dashboard'),
  '/settings': formatPageTitle('Settings'),
  '/privacy': formatPageTitle('Privacy'),
  '/forgot-password': formatPageTitle('Reset password')
};

/** @param {string} pathname */
export const getDocumentTitleForPath = (pathname) => {
  if (pathname.startsWith('/reset-password/')) {
    return formatPageTitle('Reset password');
  }
  return ROUTE_PAGE_TITLES[pathname] ?? formatPageTitle('Page not found');
};

/** @deprecated use SHORTLY_DEFAULT_TITLE */
export const SHORTLY_DOCUMENT_TITLE = SHORTLY_DEFAULT_TITLE;
