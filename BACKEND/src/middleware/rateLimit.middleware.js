import RateLimit from '../schema/rateLimit.model.js';
import { AppError } from '../utils/errorHandler.js';
import { logger } from '../utils/logger.js';
import crypto from 'node:crypto';

export const rateLimiter = ({
  windowMs,
  max,
  keyGenerator,
  failClosed = true
}) => {
  return async (req, res, next) => {
    try {
      const key = keyGenerator(req);
      const now = new Date();
      const windowEnd = new Date(now.getTime() + windowMs);

      const record = await RateLimit.findOneAndUpdate(
        { key },
        [
          {
            $set: {
              count: {
                $cond: {
                  if: {
                    $lte: [{ $ifNull: ['$expires_at', new Date(0)] }, now]
                  },
                  then: 1,
                  else: { $add: [{ $ifNull: ['$count', 0] }, 1] }
                }
              },
              expires_at: {
                $cond: {
                  if: {
                    $lte: [{ $ifNull: ['$expires_at', new Date(0)] }, now]
                  },
                  then: windowEnd,
                  else: '$expires_at'
                }
              }
            }
          }
        ],
        {
          upsert: true,
          returnDocument: 'after',
          projection: { count: 1, expires_at: 1, _id: 0 }
        }
      ).lean();

      if (!record) {
        throw new Error('Rate limit update returned no document');
      }

      const remaining = Math.max(0, max - record.count);
      const resetMs = record.expires_at.getTime() - Date.now();
      const resetSeconds = Math.ceil(resetMs / 1000);

      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader(
        'X-RateLimit-Reset',
        Math.ceil(record.expires_at.getTime() / 1000)
      );

      if (record.count > max) {
        res.setHeader('Retry-After', resetSeconds);
        return next(
          new AppError(
            `Too many requests. Try again in ${resetSeconds} seconds.`,
            429
          )
        );
      }

      next();
    } catch (err) {
      logger.error('Rate limit error', { error: err.message });
      if (failClosed) {
        return next(
          new AppError('Service temporarily unavailable. Try again later.', 503)
        );
      }
      next();
    }
  };
};

function normalizeEmail(email) {
  if (typeof email !== 'string') return 'unknown';
  return email.toLowerCase().trim().slice(0, 254);
}

const hashEmail = (email) =>
  crypto.createHash('sha256').update(normalizeEmail(email)).digest('hex');

/** In-process limiter for hot paths (e.g. redirects). Not shared across server instances. */
export const memoryRateLimiter = ({ windowMs, max, keyGenerator }) => {
  const buckets = new Map();

  return (req, res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();
    let bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }

    bucket.count += 1;

    const remaining = Math.max(0, max - bucket.count);
    const resetSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(bucket.resetAt / 1000));

    if (bucket.count > max) {
      res.setHeader('Retry-After', resetSeconds);
      return next(
        new AppError(
          `Too many requests. Try again in ${resetSeconds} seconds.`,
          429
        )
      );
    }

    next();
  };
};

export const keyGenerators = {
  ip: (req) => `ip:${req.ip}`,
  loginAccount: (req) =>
    `login-account:${hashEmail(req.validatedBody?.email ?? req.body?.email)}`,
  loginIp: (req) => `login-ip:${req.ip}`,
  recoveryAccount: (req) =>
    `recovery-account:${hashEmail(req.validatedBody?.email ?? req.body?.email)}`,
  recoveryIp: (req) => `recovery-ip:${req.ip}`,
  userId: (req) => `user:${req.user?._id || 'anon'}`,
  ipPerEndpoint: (endpoint) => (req) => `${endpoint}:${req.ip}`
};
