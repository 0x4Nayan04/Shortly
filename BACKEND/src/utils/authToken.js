import { verifyToken } from './helper.js';
import User from '../schema/user.model.js';

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

  const user = await User.findById(decoded.id);
  if (!user) return { kind: 'missing' };
  if (!isTokenVersionValid(user, decoded)) return { kind: 'revoked' };
  user.password = undefined;
  return { kind: 'ok', user };
};
