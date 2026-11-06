import { logger } from '../utils/logger.js';
import { performance } from 'node:perf_hooks';
import { requestTiming } from '../utils/requestTiming.js';

export const latencyMiddleware = (req, res, next) => {
  const start = performance.now();
  const timing = { steps: {}, states: {} };

  res.on('finish', () => {
    const durationMs = Math.round((performance.now() - start) * 100) / 100;
    const level =
      res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

    const payload = {
      requestId: req.requestId,
      method: req.method,
      path: (req.originalUrl || req.url).split('?')[0],
      statusCode: res.statusCode,
      durationMs,
      steps: timing.steps,
      timingStates: timing.states
    };

    if (req.redirectTiming) {
      payload.redirectCacheHit = req.redirectTiming.cacheHit;
      payload.redirectLookupMs = req.redirectTiming.lookupMs;
    }

    logger[level]('request', payload);
  });

  requestTiming.run(timing, next);
};
