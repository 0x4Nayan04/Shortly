import { measureRequestStep, recordTimingState } from './requestTiming.js';
import { verifyToken } from './helper.js';
import User from '../schema/user.model.js';

const AUTH_USER_CACHE_TTL_MS = 30_000;
const AUTH_USER_CACHE_MAX = 5_000;
const authUserCache = new Map();

export const invalidateCachedAuthUser = (userId) => {
  if (userId) authUserCache.delete(userId.toString());
};

const loadAuthUser = (cacheKey) => {
  if (authUserCache.size >= AUTH_USER_CACHE_MAX) {
    authUserCache.delete(authUserCache.keys().next().value);
  }
  const entry = { expiresAt: Date.now() + AUTH_USER_CACHE_TTL_MS };
  authUserCache.set(cacheKey, entry);
  entry.pending = measureRequestStep('auth.lookup', () =>
    User.findById(cacheKey).select('-password').lean()
  ).then((user) => {

    if (authUserCache.get(cacheKey) === entry) {
      if (user) authUserCache.set(cacheKey, {
        user, expiresAt: Date.now() + AUTH_USER_CACHE_TTL_MS
      });
      else authUserCache.delete(cacheKey);
    }
    return user;
  }).catch((error) => {
    if (authUserCache.get(cacheKey) === entry) authUserCache.delete(cacheKey);
    throw error;
  });
  return entry.pending;
};

export const getTokenFromRequest = (req) => {
  const cookieToken = req.cookies?.token;
  if (cookieToken) return cookieToken;
  const authHeader = req.headers?.authorization;
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);
  return null;
};

const isTokenVersionValid = (user, decoded) => {
  if (decoded?.tokenVersion === undefined) return false;
  return (user.tokenVersion ?? 0) === decoded.tokenVersion;
};

const verifyAuthToken = async (token) => {
  try {
    const decoded = await verifyToken(token);
    return { ok: true, decoded };
  } catch (err) {
    if (err?.name === 'TokenExpiredError')
      return { ok: false, reason: 'expired' };
    if (err?.name === 'JsonWebTokenError')
      return { ok: false, reason: 'invalid' };
    return { ok: false, reason: 'unknown' };
  }
};

const sameUser = (a, b) => Boolean(a) && a._id.toString() === b.id.toString();

const TOKEN_FAILURE_MESSAGE = {
  expired: 'Token has expired. Please login again.',
  invalid: 'Invalid token. Please login again.',
  unknown: 'Token verification failed.'
};

const USER_FAILURE_MESSAGE = {
  missing: 'Invalid token. Please login again.',
  revoked: 'Session revoked. Please login again.'
};

export const decodeTokenClaims = async (token) => {
  const result = await verifyAuthToken(token);
  if (!result.ok) return null;
  const { decoded } = result;
  return { id: decoded.id, tokenVersion: decoded.tokenVersion };
};

export const authFailureMessage = (resolved) => {
  if (resolved.kind === 'invalid') {
    return (
      TOKEN_FAILURE_MESSAGE[resolved.reason] ?? TOKEN_FAILURE_MESSAGE.unknown
    );
  }
  return USER_FAILURE_MESSAGE[resolved.kind] ?? TOKEN_FAILURE_MESSAGE.unknown;
};

export const resolveUserFromToken = async (req, token) => {
  const result = await verifyAuthToken(token);
  if (!result.ok) return { kind: 'invalid', reason: result.reason };
  const { decoded } = result;

  if (
    req.user &&
    sameUser(req.user, decoded) &&
    isTokenVersionValid(req.user, decoded)
  ) {
    return { kind: 'ok', user: req.user };
  }

  const cacheKey = decoded.id.toString();
  const cached = authUserCache.get(cacheKey);
  const usable = cached?.expiresAt > Date.now();
  recordTimingState('authCacheHit', Boolean(usable && cached.user));
  recordTimingState('authLookupShared', Boolean(usable && cached.pending));
  let user;
  if (usable) {
    user = cached.user ?? await measureRequestStep('auth.lookupWait', () => cached.pending);
  } else {
    if (cached) authUserCache.delete(cacheKey);
    user = await loadAuthUser(cacheKey);
  }
  if (!user) return { kind: 'missing' };
  if (!isTokenVersionValid(user, decoded)) return { kind: 'revoked' };
  return { kind: 'ok', user };
};
