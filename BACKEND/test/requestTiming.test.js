import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { requestTiming, measureRequestStep, recordTimingState } from '../src/utils/requestTiming.js';
import { latencyMiddleware } from '../src/middleware/latency.middleware.js';
import { logger } from '../src/utils/logger.js';

test('parallel request timing contexts remain isolated and errors are timed', async () => {
  const contexts = [{ steps: {}, states: {} }, { steps: {}, states: {} }];
  await Promise.all(contexts.map((context, index) => requestTiming.run(context, async () => {
    recordTimingState('cacheHit', index === 0);
    await measureRequestStep('lookup', async () => {
      await new Promise((resolve) => setTimeout(resolve, 2));
    });
    await assert.rejects(measureRequestStep('lookup', () => Promise.reject(new Error('failed'))));
  })));
  assert.notEqual(contexts[0].steps.lookup, contexts[1].steps.lookup);
  for (const context of contexts) {
    assert.equal(context.steps.lookup.count, 2);
    assert.ok(context.steps.lookup.totalMs >= 0);
  }
  assert.equal(contexts[0].states.cacheHit, true);
  assert.equal(contexts[1].states.cacheHit, false);
  assert.equal(await measureRequestStep('outsideRequest', () => 42), 42);
});

test('request log contains timings without query-string tokens', async () => {
  const original = logger.info;
  let logged;
  logger.info = (_message, payload) => { logged = payload; };
  try {
    const req = { requestId: 'test-id', method: 'GET', originalUrl: '/api/create/stats?token=secret' };
    const res = new EventEmitter();
    res.statusCode = 200;
    await new Promise((resolve, reject) => latencyMiddleware(req, res, () => {
      measureRequestStep('query', async () => 1).then(() => {
        res.emit('finish');
        resolve();
      }, reject);
    }));
    assert.equal(logged.requestId, 'test-id');
    assert.equal(logged.path, '/api/create/stats');
    assert.equal(logged.steps.query.count, 1);
    assert.ok(logged.durationMs >= 0);
    assert.ok(!JSON.stringify(logged).includes('secret'));
  } finally {
    logger.info = original;
  }
});
