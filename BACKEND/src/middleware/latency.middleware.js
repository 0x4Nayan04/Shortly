import { logger } from '../utils/logger.js';

export const latencyMiddleware = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - start;
    const level =
      res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

    const payload = {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl || req.url,
      statusCode: res.statusCode,
      durationMs
    };

    if (req.redirectTiming) {
      payload.redirectCacheHit = req.redirectTiming.cacheHit;
      payload.redirectLookupMs = req.redirectTiming.lookupMs;
    }

    logger[level]('request', payload);
  });

  next();
};
