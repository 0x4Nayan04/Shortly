import RateLimit from "../schema/rateLimit.model.js";
import { AppError } from "../utils/errorHandler.js";

export const rateLimiter = ({ windowMs, max, keyGenerator, failClosed = false }) => {
  return async (req, res, next) => {
    try {
      const key = keyGenerator(req);
      const expires_at = new Date(Date.now() + windowMs);

      const record = await RateLimit.findOneAndUpdate(
        { key },
        { $inc: { count: 1 }, $setOnInsert: { expires_at } },
        { upsert: true, returnDocument: "after", projection: { count: 1, expires_at: 1, _id: 0 } }
      ).lean();

      const remaining = Math.max(0, max - record.count);
      const resetMs = record.expires_at.getTime() - Date.now();
      const resetSeconds = Math.ceil(resetMs / 1000);

      res.setHeader("X-RateLimit-Limit", max);
      res.setHeader("X-RateLimit-Remaining", remaining);
      res.setHeader("X-RateLimit-Reset", Math.ceil(record.expires_at.getTime() / 1000));

      if (record.count > max) {
        res.setHeader("Retry-After", resetSeconds);
        return next(new AppError(
          `Too many requests. Try again in ${resetSeconds} seconds.`,
          429
        ));
      }

      next();
    } catch (err) {
      console.error("Rate limit error:", err);
      if (failClosed) {
        return next(new AppError("Service temporarily unavailable. Try again later.", 503));
      }
      next();
    }
  };
};

function normalizeEmail(email) {
  return (email || "unknown").toString().toLowerCase().trim();
}

export const keyGenerators = {
  ip: (req) => `ip:${req.ip}`,
  emailIp: (req) => `login:${normalizeEmail(req.body?.email)}:${req.ip}`,
  userId: (req) => `user:${req.user?._id || "anon"}`,
  ipPerEndpoint: (endpoint) => (req) => `${endpoint}:${req.ip}`,
};
