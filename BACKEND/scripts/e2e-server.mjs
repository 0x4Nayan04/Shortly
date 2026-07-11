/**
 * Starts the API with an in-memory Mongo replica set for Playwright E2E runs.
 */
import http from 'node:http';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'e2e-secret-that-is-at-least-thirty-two-characters';
process.env.FRONT_END_URL = 'http://localhost:5173';
process.env.PUBLIC_BASE_URL = 'http://127.0.0.1:3001';
process.env.PORT = '3011';
process.env.ALLOWED_ORIGINS = 'http://localhost:5173';
process.env.TRUST_PROXY = '0';
process.env.ADMIN_EMAILS = 'e2e-admin@example.com';

const replSet = await MongoMemoryReplSet.create({
  replSet: { count: 1, storageEngine: 'wiredTiger' }
});
process.env.MONGODB_URI = replSet.getUri('shortly_e2e');

const { createApp } = await import('../src/app.js');
const { default: ShortUrl } = await import('../src/schema/shortUrl.model.js');
const { default: Click } = await import('../src/schema/click.model.js');
const { default: User } = await import('../src/schema/user.model.js');
const { default: RateLimit } = await import('../src/schema/rateLimit.model.js');
const { default: AbuseReport } = await import('../src/schema/abuseReport.model.js');

await mongoose.connect(process.env.MONGODB_URI);
await Promise.all([
  ShortUrl.syncIndexes(),
  Click.syncIndexes(),
  User.syncIndexes(),
  RateLimit.syncIndexes(),
  AbuseReport.syncIndexes()
]);

const app = createApp();
const server = http.createServer(app);

server.listen(Number(process.env.PORT), '127.0.0.1', () => {
  console.log(`[e2e-server] listening on ${process.env.PORT}`);
});

const shutdown = async () => {
  server.close();
  await mongoose.disconnect();
  await replSet.stop();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
