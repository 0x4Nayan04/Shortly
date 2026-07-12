/**
 * Process-local cache / rate-limiter characterization for multi-instance caveats.
 *
 * Child processes load separate module graphs, proving auth-user + stats caches
 * and memoryRateLimiter Maps are NOT shared across processes (Railway replica caveat).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-that-is-at-least-thirty-two-characters';
process.env.FRONT_END_URL = 'http://frontend.test';
process.env.PUBLIC_BASE_URL = 'http://short.test';
process.env.PORT = '3001';
process.env.ALLOWED_ORIGINS = 'http://frontend.test';

const __dirname = dirname(fileURLToPath(import.meta.url));
const childScript = join(__dirname, 'fixtures/processLocalCache.child.mjs');

function runChild(mode) {
  const result = spawnSync(process.execPath, [childScript], {
    env: { ...process.env, CACHE_CHILD_MODE: mode },
    encoding: 'utf8',
    timeout: 120_000
  });
  if (result.status !== 0) {
    throw new Error(
      `child ${mode} failed (${result.status}): ${result.stderr || result.stdout}`
    );
  }
  const line = result.stdout
    .trim()
    .split('\n')
    .filter(Boolean)
    .at(-1);
  return JSON.parse(line);
}

test('auth-user cache is process-local (warm process A does not warm process B)', () => {
  const a = runChild('auth-prime');
  assert.equal(a.findByIdCalls, 1);
  assert.notEqual(a.pid, process.pid);

  const b = runChild('auth-hit-check');
  assert.equal(b.findByIdCalls, 1);
  assert.notEqual(a.pid, b.pid);
});

test('stats cache is process-local (process B still cold after process A prime)', () => {
  const a = runChild('stats-prime');
  assert.equal(a.aggregateCalls, 1);

  const b = runChild('stats-cold');
  assert.equal(b.aggregateCalls, 1);
  assert.notEqual(a.pid, b.pid);
});

test('memoryRateLimiter buckets are process-local across child processes', () => {
  const a = runChild('memory-limiter');
  const b = runChild('memory-limiter');
  // Each process allows max=2 successes independently.
  assert.equal(a.ok, 2);
  assert.equal(a.blocked, 2);
  assert.equal(b.ok, 2);
  assert.equal(b.blocked, 2);
  assert.notEqual(a.pid, b.pid);
});
