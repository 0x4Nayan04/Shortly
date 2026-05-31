import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'fs/promises';

test('rate limiter uses one atomic pipeline update per request', async () => {
  const middleware = await readFile(
    new URL('../src/middleware/rateLimit.middleware.js', import.meta.url),
    'utf8'
  );
  assert.doesNotMatch(middleware, /RateLimit\.findOne\(/);
  assert.match(middleware, /\$ifNull:\s*\['\$expires_at'/);
  assert.match(middleware, /\$cond:/);
});

test('rate limit key is unique in schema', async () => {
  const schema = await readFile(
    new URL('../src/schema/rateLimit.model.js', import.meta.url),
    'utf8'
  );
  assert.match(schema, /unique:\s*true/);
});
