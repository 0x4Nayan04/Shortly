
import { writeFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'local-benchmark-secret-at-least-thirty-two-characters';
process.env.FRONT_END_URL = 'http://frontend.test';
process.env.PUBLIC_BASE_URL = 'http://short.test';
process.env.ALLOWED_ORIGINS = 'http://frontend.test';
process.env.PORT = '3001';

const { createApp } = await import('../src/app.js');
const { default: User } = await import('../src/schema/user.model.js');
const { default: ShortUrl } = await import('../src/schema/shortUrl.model.js');
const { default: Click } = await import('../src/schema/click.model.js');
const { default: RateLimit } = await import('../src/schema/rateLimit.model.js');
const { signToken } = await import('../src/utils/helper.js');
const { invalidateStatsForUser } = await import('../src/services/shortUrl.services.js');
const { logger } = await import('../src/utils/logger.js');

const replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
const reports = [];
const originalInfo = logger.info;
let requestLog;
logger.info = (message, payload) => {
  if (message === 'request') requestLog = payload;
};

try {
  process.env.MONGODB_URI = replSet.getUri('shortly_benchmark');
  await mongoose.connect(process.env.MONGODB_URI, { monitorCommands: true });
  await Promise.all([User.init(), ShortUrl.init(), Click.init(), RateLimit.init()]);
  const user = await User.create({
    name: 'Local Benchmark', email: 'benchmark@example.com',
    password: 'benchmark-only-correct-horse', isEmailVerified: true,
    activeLinkCount: 40
  });
  const links = await ShortUrl.insertMany(Array.from({ length: 40 }, (_, i) => ({
    user: user._id, short_url: `bench-${i}`,
    full_url: `https://example.com/fixture-${i}`,
    canonical_url: `https://example.com/fixture-${i}`, click: 25
  })));
  await Click.insertMany(Array.from({ length: 1000 }, (_, i) => ({
    short_url_id: links[i % links.length]._id, country: 'IN',
    device_type: 'desktop', browser: 'Chrome', os: 'Test'
  })));
  const cookie = `token=${signToken({ id: user._id, tokenVersion: 0 })}`;
  const app = createApp();
  const origin = { Origin: 'http://frontend.test', Cookie: cookie };
  let commands = [];
  mongoose.connection.getClient().on('commandStarted', (event) => {
    if (['find', 'findAndModify', 'update', 'insert', 'aggregate', 'distinct', 'commitTransaction'].includes(event.commandName)) {
      commands.push(event.commandName);
    }
  });
  await request(app).get('/api/create/my-urls').set(origin);

  async function sample(action, count, run, before = () => {}) {

    await RateLimit.deleteMany({});
    for (let i = 0; i < count; i += 1) {
      await before();
      commands = [];
      requestLog = null;
      const start = performance.now();
      const response = await run(i);
      const elapsedMs = performance.now() - start;
      if (response.status >= 400) throw new Error(`${action}: HTTP ${response.status}`);
      reports.push({ action, sample: i + 1, elapsedMs,
        status: response.status, commands: [...commands], ...requestLog });
    }
  }

  await sample('login', 3, () => request(app).post('/api/auth/login').send({
    email: user.email, password: 'benchmark-only-correct-horse'
  }));
  await sample('create', 10, (i) => request(app).post('/api/create').set(origin)
    .send({ full_url: `https://example.com/new-${i}` }));
  await sample('reuse', 10, () => request(app).post('/api/create').set(origin)
    .send({ full_url: 'https://example.com/new-0' }));
  await sample('edit', 10, (i) => request(app).patch(`/api/create/${links[0]._id}`)
    .set(origin).send({ full_url: `https://example.com/edited-${i}` }));
  await sample('toggle', 10, (i) => request(app).patch(`/api/create/${links[0]._id}`)
    .set(origin).send({ disabled: i % 2 === 0 }));
  await sample('list', 10, () => request(app).get('/api/create/my-urls').set(origin));
  await sample('overview-miss', 10, () => request(app).get('/api/create/stats').set(origin),
    () => invalidateStatsForUser(user._id));
  await sample('overview-hit', 10, () => request(app).get('/api/create/stats').set(origin));
  await sample('analytics-miss', 10, () => request(app).get('/api/create/stats/analytics').set(origin),
    () => invalidateStatsForUser(user._id));
  await sample('analytics-hit', 10, () => request(app).get('/api/create/stats/analytics').set(origin));

  const summary = [...new Set(reports.map((r) => r.action))].map((action) => {
    const rows = reports.filter((r) => r.action === action);
    const durations = rows.map((r) => r.durationMs).sort((a, b) => a - b);
    const mid = Math.floor(durations.length / 2);
    const median = durations.length % 2 ? durations[mid] : (durations[mid - 1] + durations[mid]) / 2;
    return { action, n: rows.length, medianMs: +median.toFixed(2),
      minMs: durations[0], maxMs: durations.at(-1),
      commandCounts: [...new Set(rows.map((r) => r.commands.length))] };
  });
  const report = { conditions: { timestamp: new Date().toISOString(),
    node: process.version, mongoose: mongoose.version,
    target: 'isolated in-process app + local disposable MongoDB replica set',
    fixture: '40 initial links / 1000 click events / 10 new links',
    timing: 'server duration; no simulated network latency; sequential requests',
    note: 'Local diagnostic, not production latency or browser completion time' }, summary, samples: reports };
  if (process.argv[2]) await writeFile(process.argv[2], JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ conditions: report.conditions, summary }, null, 2));
} finally {
  logger.info = originalInfo;
  await mongoose.disconnect();
  await replSet.stop();
}
