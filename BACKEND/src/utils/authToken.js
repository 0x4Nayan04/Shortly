export const getTokenFromRequest = (req) => {
  const cookieToken = req.cookies?.token;
  if (cookieToken) return cookieToken;
  const authHeader = req.headers?.authorization;
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);
  return null;
};

export const isTokenVersionValid = (user, decoded) => {
  if (decoded?.tokenVersion === undefined) return false;
  return (user.tokenVersion ?? 0) === decoded.tokenVersion;
};
