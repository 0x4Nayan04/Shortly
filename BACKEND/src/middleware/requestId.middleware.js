import { randomUUID } from 'node:crypto';

const REQUEST_ID_HEADER = 'X-Request-Id';
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function resolveRequestId(req) {
  const incoming = req.get(REQUEST_ID_HEADER);
  if (incoming && UUID_PATTERN.test(incoming)) {
    return incoming;
  }
  return randomUUID();
}

export const requestIdMiddleware = (req, res, next) => {
  const requestId = resolveRequestId(req);
  req.requestId = requestId;
  res.setHeader(REQUEST_ID_HEADER, requestId);
  next();
};
