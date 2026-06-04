/** Canonical app paths — single source for routing, guards, and axios session checks. */

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  SETTINGS: '/settings',
  PRIVACY: '/privacy',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  VERIFY_EMAIL: '/verify-email'
};

/** Auth flows only available to signed-out users (redirect to dashboard when signed in). */
const GUEST_ONLY_PATHS = [
  ROUTES.LOGIN,
  ROUTES.REGISTER,
  ROUTES.FORGOT_PASSWORD
];

function isGuestOnlyPath(pathname) {
  if (GUEST_ONLY_PATHS.includes(pathname)) return true;
  return (
    pathname.startsWith(`${ROUTES.RESET_PASSWORD}/`) ||
    pathname.startsWith(`${ROUTES.VERIFY_EMAIL}/`)
  );
}

/** Auth API endpoints that must not trigger a session-expired redirect. */
const AUTH_API_PATHS = [
  '/auth/me',
  '/auth/login',
  '/auth/register',
  '/auth/verify-email'
];

export function isAuthApiPath(url) {
  return AUTH_API_PATHS.some((segment) => url.includes(segment));
}

/** Browser paths where a 401 should not dispatch `auth:expired`. */
export function shouldSuppressSessionExpired(pathname) {
  return isGuestOnlyPath(pathname);
}

export function getSafeReturnPath(raw) {
  if (!raw || typeof raw !== 'string') return null;

  let decoded;
  try {
    decoded = decodeURIComponent(raw.trim());
  } catch {
    return null;
  }

  if (
    !decoded.startsWith('/') ||
    decoded.startsWith('//') ||
    decoded.includes('://')
  ) {
    return null;
  }

  const pathname = decoded.split('?')[0].split('#')[0];
  if (isGuestOnlyPath(pathname)) return null;

  return decoded;
}
