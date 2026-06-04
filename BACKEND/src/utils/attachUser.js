import {
  decodeTokenClaims,
  getTokenFromRequest,
  resolveUserFromToken
} from './authToken.js';

export const attachUser = async (req, res, next) => {
  const token = getTokenFromRequest(req);
  if (!token) return next();

  const claims = await decodeTokenClaims(token);
  if (!claims) return next();

  req.authUserId = claims.id;
  req.authTokenVersion = claims.tokenVersion;
  next();
};

export const loadUserIfAuthenticated = async (req, res, next) => {
  const token = getTokenFromRequest(req);
  if (!token) return next();

  const resolved = await resolveUserFromToken(req, token);
  if (resolved.kind !== 'ok') return next();

  req.user = resolved.user;
  req.authUserId = resolved.user._id;
  req.authTokenVersion = resolved.user.tokenVersion ?? 0;
  next();
};
