import test from 'node:test';
import assert from 'node:assert/strict';
import { memoryRateLimiter } from '../src/middleware/rateLimit.middleware.js';

function runLimiter(limiter, ip = '203.0.113.1') {
  return new Promise((resolve, reject) => {
    const headers = {};
    const req = { ip };
    const res = {
      setHeader(name, value) {
        headers[name] = value;
      }
    };
    limiter(req, res, (error) => {
      if (error) reject(error);
      else resolve(headers);
    });
  });
}

test('memoryRateLimiter evicts expired buckets on access and periodic sweep', async () => {
  const windowMs = 50;
  const limiter = memoryRateLimiter({
    windowMs,
    max: 5,
    keyGenerator: (req) => `ip:${req.ip}`
  });

  await runLimiter(limiter, '203.0.113.10');
  await runLimiter(limiter, '203.0.113.11');

  await new Promise((resolve) => setTimeout(resolve, windowMs + 10));

  await runLimiter(limiter, '203.0.113.10');
  const headers = await runLimiter(limiter, '203.0.113.10');

  assert.equal(headers['X-RateLimit-Remaining'], 3);
});

test('memoryRateLimiter enforces max bucket count', async () => {
  const limiter = memoryRateLimiter({
    windowMs: 60_000,
    max: 100,
    maxBuckets: 2,
    keyGenerator: (req) => `ip:${req.ip}`
  });

  const first = await runLimiter(limiter, '203.0.113.1');
  assert.equal(first['X-RateLimit-Remaining'], 99);

  await runLimiter(limiter, '203.0.113.2');
  await runLimiter(limiter, '203.0.113.3');

  const firstAgain = await runLimiter(limiter, '203.0.113.1');
  assert.equal(firstAgain['X-RateLimit-Remaining'], 99);
});
