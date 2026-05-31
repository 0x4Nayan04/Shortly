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
export const GUEST_ONLY_PATHS = [
  ROUTES.LOGIN,
  ROUTES.REGISTER,
  ROUTES.FORGOT_PASSWORD
];

export function isGuestOnlyPath(pathname) {
  if (GUEST_ONLY_PATHS.includes(pathname)) return true;
  return (
    pathname.startsWith(`${ROUTES.RESET_PASSWORD}/`) ||
    pathname.startsWith(`${ROUTES.VERIFY_EMAIL}/`)
  );
}

export const PROTECTED_PATHS = [ROUTES.DASHBOARD, ROUTES.SETTINGS];

export function isProtectedPath(pathname) {
  return PROTECTED_PATHS.includes(pathname);
}

/** Auth API endpoints that must not trigger a session-expired redirect. */
export const AUTH_API_PATHS = [
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
