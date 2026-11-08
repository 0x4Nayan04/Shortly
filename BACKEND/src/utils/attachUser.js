import {
  getTokenFromRequest,
  resolveUserFromToken
} from './authToken.js';


export const loadUserIfAuthenticated = async (req, res, next) => {
  const token = getTokenFromRequest(req);
  if (!token) return next();

  const resolved = await resolveUserFromToken(req, token);
  if (resolved.kind !== 'ok') return next();

  req.user = resolved.user;
  next();
};
