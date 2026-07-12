import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-that-is-at-least-thirty-two-characters';
process.env.FRONT_END_URL = 'http://frontend.test';
process.env.PUBLIC_BASE_URL = 'http://short.test';
process.env.PORT = '3001';
process.env.ALLOWED_ORIGINS = 'http://frontend.test';

const { default: User } = await import('../src/schema/user.model.js');
const { default: ShortUrl } = await import('../src/schema/shortUrl.model.js');
const { default: Click } = await import('../src/schema/click.model.js');
const { signToken } = await import('../src/utils/helper.js');
const { resolveUserFromToken, invalidateCachedAuthUser } =
  await import('../src/utils/authToken.js');
const { getStatsForUserService, invalidateStatsForUser } =
  await import('../src/services/shortUrl.services.js');

let replSet;
let findByIdCalls = 0;
const originalFindById = User.findById.bind(User);

test.before(async () => {
  replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: 'wiredTiger' }
  });
  await mongoose.connect(replSet.getUri('shortly_cache_test'));
  await Promise.all([
    User.syncIndexes(),
    ShortUrl.syncIndexes(),
    Click.syncIndexes()
  ]);

  User.findById = (...args) => {
    findByIdCalls += 1;
    return originalFindById(...args);
  };
});

test.after(async () => {
  User.findById = originalFindById;
  await mongoose.disconnect();
  await replSet.stop();
});

test.beforeEach(async () => {
  findByIdCalls = 0;
  await Promise.all([
    User.deleteMany({}),
    ShortUrl.deleteMany({}),
    Click.deleteMany({})
  ]);
});

async function createUserAndToken() {
  const user = await User.create({
    name: 'Cache Tester',
    email: `cache-${Date.now()}@example.com`,
    password: 'hashed-not-used-here'
  });
  const token = await signToken({
    id: user._id,
    tokenVersion: user.tokenVersion ?? 0
  });
  return { user, token };
}

test('auth-user cache: first resolve reads Mongo; repeat within TTL does not', async () => {
  const { token } = await createUserAndToken();
  const req = {};

  const first = await resolveUserFromToken(req, token);
  assert.equal(first.kind, 'ok');
  assert.equal(findByIdCalls, 1);

  const second = await resolveUserFromToken({}, token);
  assert.equal(second.kind, 'ok');
  assert.equal(findByIdCalls, 1);
});

test('auth-user cache: invalidate forces a Mongo re-read', async () => {
  const { user, token } = await createUserAndToken();

  await resolveUserFromToken({}, token);
  assert.equal(findByIdCalls, 1);

  invalidateCachedAuthUser(user._id);
  await resolveUserFromToken({}, token);
  assert.equal(findByIdCalls, 2);
});

test('auth-user cache: expired entry re-reads MongoDB', async () => {
  const { token } = await createUserAndToken();
  const realNow = Date.now;
  let offset = 0;
  Date.now = () => realNow() + offset;

  try {
    await resolveUserFromToken({}, token);
    assert.equal(findByIdCalls, 1);

    offset = 31_000;
    await resolveUserFromToken({}, token);
    assert.equal(findByIdCalls, 2);
  } finally {
    Date.now = realNow;
  }
});

test('auth-user cache: req.user reuse skips cache and Mongo when valid', async () => {
  const { user, token } = await createUserAndToken();
  const lean = await User.findById(user._id).select('-password').lean();
  findByIdCalls = 0;

  const resolved = await resolveUserFromToken({ user: lean }, token);
  assert.equal(resolved.kind, 'ok');
  assert.equal(findByIdCalls, 0);
});

test('stats cache: concurrent cold requests share one build (single Click.aggregate)', async () => {
  const user = await User.create({
    name: 'Stats Tester',
    email: `stats-${Date.now()}@example.com`,
    password: 'hashed'
  });
  const link = await ShortUrl.create({
    short_url: 'cachestats1',
    full_url: 'https://example.com/a',
    canonical_url: 'https://example.com/a',
    user: user._id,
    click: 3,
    disabled: false,
    retiredAt: null
  });
  await Click.insertMany([
    { short_url_id: link._id, country: 'US', timestamp: new Date() },
    { short_url_id: link._id, country: 'IN', timestamp: new Date() }
  ]);

  let aggregateCalls = 0;
  const originalAggregate = Click.aggregate.bind(Click);
  Click.aggregate = (...args) => {
    aggregateCalls += 1;
    return originalAggregate(...args);
  };

  try {
    invalidateStatsForUser(user._id);
    const [a, b, c] = await Promise.all([
      getStatsForUserService({ userId: user._id }),
      getStatsForUserService({ userId: user._id }),
      getStatsForUserService({ userId: user._id })
    ]);
    assert.equal(aggregateCalls, 1);
    assert.equal(a.stats.totalUrls, b.stats.totalUrls);
    assert.equal(b.stats.totalUrls, c.stats.totalUrls);
  } finally {
    Click.aggregate = originalAggregate;
  }
});

test('stats cache: warm hit skips Click.aggregate; invalidate rebuilds', async () => {
  const user = await User.create({
    name: 'Stats Warm',
    email: `stats-warm-${Date.now()}@example.com`,
    password: 'hashed'
  });
  await ShortUrl.create({
    short_url: 'cachestats2',
    full_url: 'https://example.com/b',
    canonical_url: 'https://example.com/b',
    user: user._id,
    click: 0,
    disabled: false,
    retiredAt: null
  });

  let aggregateCalls = 0;
  const originalAggregate = Click.aggregate.bind(Click);
  Click.aggregate = (...args) => {
    aggregateCalls += 1;
    return originalAggregate(...args);
  };

  try {
    invalidateStatsForUser(user._id);
    await getStatsForUserService({ userId: user._id });
    assert.equal(aggregateCalls, 1);

    await getStatsForUserService({ userId: user._id });
    assert.equal(aggregateCalls, 1);

    invalidateStatsForUser(user._id);
    await getStatsForUserService({ userId: user._id });
    assert.equal(aggregateCalls, 2);
  } finally {
    Click.aggregate = originalAggregate;
  }
});
