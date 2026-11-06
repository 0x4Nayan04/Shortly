import test from 'node:test';
import assert from 'node:assert/strict';
import RateLimit from '../src/schema/rateLimit.model.js';
import { rateLimiter, keyGenerators } from '../src/middleware/rateLimit.middleware.js';

test('store failures preserve fail-closed and fail-open policies', async () => {
  const original = RateLimit.findOneAndUpdate;
  RateLimit.findOneAndUpdate = () => { throw new Error('store unavailable'); };
  try {
    for (const failClosed of [true, false]) {
      const middleware = rateLimiter({ policy: 'test', windowMs: 1000,
        max: 1, keyGenerator: keyGenerators.ip, failClosed });
      let received;
      let called = false;
      await middleware({ ip: '127.0.0.1' }, {}, (error) => { called = true; received = error; });
      assert.equal(called, true);
      if (failClosed) assert.equal(received.statusCode, 503);
      else assert.equal(received, undefined);
    }
  } finally {
    RateLimit.findOneAndUpdate = original;
  }
});
