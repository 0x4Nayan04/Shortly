/** Brand assets, document metadata, and route titles */

import { ROUTES } from './routes';

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
  [ROUTES.HOME]: SHORTLY_DEFAULT_TITLE,
  [ROUTES.LOGIN]: formatPageTitle('Sign in'),
  [ROUTES.REGISTER]: formatPageTitle('Create account'),
  [ROUTES.DASHBOARD]: formatPageTitle('Dashboard'),
  [ROUTES.SETTINGS]: formatPageTitle('Settings'),
  [ROUTES.PRIVACY]: formatPageTitle('Privacy'),
  [ROUTES.FORGOT_PASSWORD]: formatPageTitle('Reset password')
};

/** @param {string} pathname */
export const getDocumentTitleForPath = (pathname) => {
  if (pathname.startsWith(`${ROUTES.RESET_PASSWORD}/`)) {
    return formatPageTitle('Reset password');
  }
  if (pathname.startsWith(`${ROUTES.VERIFY_EMAIL}/`)) {
    return formatPageTitle('Verify email');
  }
  return ROUTE_PAGE_TITLES[pathname] ?? formatPageTitle('Page not found');
};

/** @deprecated use SHORTLY_DEFAULT_TITLE */
export const SHORTLY_DOCUMENT_TITLE = SHORTLY_DEFAULT_TITLE;
