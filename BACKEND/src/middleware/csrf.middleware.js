import { AppError } from '../utils/errorHandler.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const normalizeOrigin = (url) => url?.replace(/\/+$/, '') ?? '';

const configuredOrigins = () => {
  const configured = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((url) => url.trim())
    : [process.env.FRONT_END_URL];
  return configured.filter(Boolean).map(normalizeOrigin);
};

const sameOriginFromRequest = (req) => {
  const proto = req.get('x-forwarded-proto') || req.protocol;
  const host = req.get('x-forwarded-host') || req.get('host');
  return host ? normalizeOrigin(`${proto}://${host}`) : '';
};

const requestOrigin = (req) => {
  const origin = req.get('origin');
  if (origin) return normalizeOrigin(origin);

  const referer = req.get('referer') || req.get('referrer');
  if (!referer) return '';

  try {
    const parsed = new URL(referer);
    return normalizeOrigin(parsed.origin);
  } catch {
    return '';
  }
};

export const csrfProtection = (req, _res, next) => {
  if (SAFE_METHODS.has(req.method)) return next();

  const usesCookieAuth = Boolean(req.cookies?.token);
  if (!usesCookieAuth) return next();

  const incomingOrigin = requestOrigin(req);
  const allowed = new Set([...configuredOrigins(), sameOriginFromRequest(req)]);

  if (incomingOrigin && allowed.has(incomingOrigin)) {
    return next();
  }

  return next(new AppError('Invalid request origin', 403));
};
