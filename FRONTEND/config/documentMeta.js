import { ROUTES } from '../src/constants/routes.js';

export const SHORTLY_SITE_NAME = 'Shortly';

export const SHORTLY_DEFAULT_TITLE = 'Shortly · Short links & analytics';

export const SHORTLY_META_DESCRIPTION =
  'Shortly is a privacy-first URL shortener. Shorten links instantly, use custom aliases, and get click analytics without storing visitor IP addresses or tracking cookies.';

export const SHORTLY_OG_IMAGE = '/og-image.png';
export const SHORTLY_OG_IMAGE_WIDTH = 1200;
export const SHORTLY_OG_IMAGE_HEIGHT = 630;

/** Production canonical origin; override with VITE_PUBLIC_SHORT_URL at build time. */
export const SHORTLY_SITE_URL = 'https://shortly.nayanswarnkar.com';

/** Routes that receive crawler-specific HTML shells and static SEO metadata. */
export const SEO_PUBLIC_PATHS = [
  ROUTES.HOME,
  ROUTES.PRIVACY,
  ROUTES.TERMS,
  ROUTES.CONTACT
];

const ROUTE_META_DESCRIPTIONS = {
  [ROUTES.HOME]: SHORTLY_META_DESCRIPTION,
  [ROUTES.PRIVACY]:
    'Shortly privacy policy: what data we collect for accounts and click analytics, subprocessors, retention, your rights, and how to contact the operator.',
  [ROUTES.TERMS]:
    'Shortly Terms of Service: acceptable use, link suspension, liability limits, and how we handle abuse reports.',
  [ROUTES.CONTACT]:
    'Contact Shortly for product support, abuse reports, security disclosures, and privacy requests.',
  [ROUTES.LOGIN]:
    'Sign in to your Shortly account to manage short links, aliases, and click analytics.',
  [ROUTES.REGISTER]:
    'Create a Shortly account to save short links, use custom aliases, and view privacy-first click analytics.',
  [ROUTES.DASHBOARD]:
    'Manage your Shortly short links, aliases, QR codes, and click analytics from your dashboard.',
  [ROUTES.SETTINGS]:
    'Update your Shortly profile, password, and account settings.',
  [ROUTES.REPORT]:
    'Report abusive, malicious, or misleading Shortly short links for operator review.',
  [ROUTES.FORGOT_PASSWORD]:
    'Request a password reset link for your Shortly account.'
};

/** @param {string} pageTitle e.g. "Dashboard" */
const formatPageTitle = (pageTitle) => `${pageTitle} · ${SHORTLY_SITE_NAME}`;

const ROUTE_PAGE_TITLES = {
  [ROUTES.HOME]: SHORTLY_DEFAULT_TITLE,
  [ROUTES.LOGIN]: formatPageTitle('Sign in'),
  [ROUTES.REGISTER]: formatPageTitle('Create account'),
  [ROUTES.DASHBOARD]: formatPageTitle('Dashboard'),
  [ROUTES.SETTINGS]: formatPageTitle('Settings'),
  [ROUTES.PRIVACY]: formatPageTitle('Privacy'),
  [ROUTES.TERMS]: formatPageTitle('Terms'),
  [ROUTES.CONTACT]: formatPageTitle('Contact'),
  [ROUTES.REPORT]: formatPageTitle('Report abuse'),
  [ROUTES.FORGOT_PASSWORD]: formatPageTitle('Reset password')
};

/** @param {string} pathname */
export function normalizePublicPath(pathname) {
  if (!pathname || pathname === '/') return ROUTES.HOME;
  const trimmed = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  return trimmed || ROUTES.HOME;
}

/** @param {string} pathname */
export function getDocumentTitleForPath(pathname) {
  const normalized = normalizePublicPath(pathname);
  if (normalized.startsWith(`${ROUTES.RESET_PASSWORD}/`)) {
    return formatPageTitle('Reset password');
  }
  if (normalized.startsWith(`${ROUTES.VERIFY_EMAIL}/`)) {
    return formatPageTitle('Verify email');
  }
  return ROUTE_PAGE_TITLES[normalized] ?? formatPageTitle('Page not found');
}

/** @param {string} pathname */
export function getMetaDescriptionForPath(pathname) {
  const normalized = normalizePublicPath(pathname);
  if (normalized.startsWith(`${ROUTES.RESET_PASSWORD}/`)) {
    return 'Choose a new password for your Shortly account.';
  }
  if (normalized.startsWith(`${ROUTES.VERIFY_EMAIL}/`)) {
    return 'Confirm your email address to activate your Shortly account.';
  }
  return (
    ROUTE_META_DESCRIPTIONS[normalized] ??
    'Shortly is a privacy-first URL shortener with custom aliases and click analytics.'
  );
}

/**
 * @param {string} pathname
 * @param {string} [siteOrigin]
 */
export function getDocumentMetaForPath(pathname, siteOrigin = SHORTLY_SITE_URL) {
  const normalized = normalizePublicPath(pathname);
  const origin = siteOrigin.replace(/\/$/, '');
  const canonicalPath = normalized === ROUTES.HOME ? '' : normalized;

  return {
    pathname: normalized,
    title: getDocumentTitleForPath(normalized),
    description: getMetaDescriptionForPath(normalized),
    canonicalUrl: `${origin}${canonicalPath}`,
    ogImageUrl: `${origin}${SHORTLY_OG_IMAGE}`,
    ogImageWidth: SHORTLY_OG_IMAGE_WIDTH,
    ogImageHeight: SHORTLY_OG_IMAGE_HEIGHT,
    siteName: SHORTLY_SITE_NAME
  };
}

/** @param {string} pathname */
export function getSeoShellPath(pathname) {
  const normalized = normalizePublicPath(pathname);
  if (!SEO_PUBLIC_PATHS.includes(normalized)) return null;
  const slug = normalized === ROUTES.HOME ? 'home' : normalized.slice(1);
  return `/_seo/${slug}.html`;
}
