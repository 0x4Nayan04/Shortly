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
const {
  getStatsForUserService,
  getClickAnalyticsForUserService,
  invalidateStatsForUser,
  resolveRedirectTargetService,
  updateOwnedShortUrlService
} = await import('../src/services/shortUrl.services.js');
const {
  clearRedirectCache,
  invalidateRedirectCache,
  REDIRECT_CACHE_TTL_MS_FOR_TESTS
} = await import('../src/services/shortUrl/redirectCache.js');

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

test('overview stats cache: concurrent cold requests share one ShortUrl.aggregate build', async () => {
  const user = await User.create({
    name: 'Stats Tester',
    email: `stats-${Date.now()}@example.com`,
    password: 'hashed'
  });
  await ShortUrl.create({
    short_url: 'cachestats1',
    full_url: 'https://example.com/a',
    canonical_url: 'https://example.com/a',
    user: user._id,
    click: 3,
    disabled: false,
    retiredAt: null
  });

  let aggregateCalls = 0;
  const originalAggregate = ShortUrl.aggregate.bind(ShortUrl);
  ShortUrl.aggregate = (...args) => {
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
    // lifetime + recent activity each call aggregate once per shared build
    assert.equal(aggregateCalls, 2);
    assert.equal(a.stats.totalUrls, b.stats.totalUrls);
    assert.equal(b.stats.totalUrls, c.stats.totalUrls);
    assert.equal(a.clickAnalytics, undefined);
  } finally {
    ShortUrl.aggregate = originalAggregate;
  }
});

test('overview stats cache: warm hit skips rebuild; invalidate rebuilds', async () => {
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
  const originalAggregate = ShortUrl.aggregate.bind(ShortUrl);
  ShortUrl.aggregate = (...args) => {
    aggregateCalls += 1;
    return originalAggregate(...args);
  };

  try {
    invalidateStatsForUser(user._id);
    await getStatsForUserService({ userId: user._id });
    assert.equal(aggregateCalls, 2);

    await getStatsForUserService({ userId: user._id });
    assert.equal(aggregateCalls, 2);

    invalidateStatsForUser(user._id);
    await getStatsForUserService({ userId: user._id });
    assert.equal(aggregateCalls, 4);
  } finally {
    ShortUrl.aggregate = originalAggregate;
  }
});

test('click analytics cache: concurrent cold requests share one Click.aggregate', async () => {
  const user = await User.create({
    name: 'Analytics Tester',
    email: `analytics-${Date.now()}@example.com`,
    password: 'hashed'
  });
  const link = await ShortUrl.create({
    short_url: 'cacheanalytics1',
    full_url: 'https://example.com/analytics',
    canonical_url: 'https://example.com/analytics',
    user: user._id,
    click: 2,
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
    const [a, b] = await Promise.all([
      getClickAnalyticsForUserService({ userId: user._id }),
      getClickAnalyticsForUserService({ userId: user._id })
    ]);
    assert.equal(aggregateCalls, 1);
    assert.equal(a.clickAnalytics.overview.total, b.clickAnalytics.overview.total);
  } finally {
    Click.aggregate = originalAggregate;
  }
});

test('redirect cache: first resolve hits Mongo; repeat within TTL does not', async () => {
  clearRedirectCache();
  await ShortUrl.create({
    short_url: 'redirwarm1',
    full_url: 'https://example.com/redirect-warm',
    canonical_url: 'https://example.com/redirect-warm',
    click: 0,
    disabled: false,
    retiredAt: null
  });

  let findCalls = 0;
  const originalFindOne = ShortUrl.findOne.bind(ShortUrl);
  ShortUrl.findOne = (...args) => {
    findCalls += 1;
    return originalFindOne(...args);
  };

  try {
    const first = await resolveRedirectTargetService('redirwarm1');
    assert.equal(first.data.full_url, 'https://example.com/redirect-warm');
    assert.equal(first.cacheHit, false);
    assert.equal(findCalls, 1);

    const second = await resolveRedirectTargetService('redirwarm1');
    assert.equal(second.cacheHit, true);
    assert.equal(findCalls, 1);
    assert.equal(second.data.full_url, first.data.full_url);
  } finally {
    ShortUrl.findOne = originalFindOne;
  }
});

test('redirect cache: invalidate after disable forces Mongo re-read and 410', async () => {
  clearRedirectCache();
  const user = await User.create({
    name: 'Redirect Cache',
    email: `redir-cache-${Date.now()}@example.com`,
    password: 'hashed'
  });
  const link = await ShortUrl.create({
    short_url: 'redirdisable1',
    full_url: 'https://example.com/disable-me',
    canonical_url: 'https://example.com/disable-me',
    user: user._id,
    click: 0,
    disabled: false,
    retiredAt: null
  });

  const warm = await resolveRedirectTargetService('redirdisable1');
  assert.equal(warm.cacheHit, false);

  await updateOwnedShortUrlService({
    userId: user._id,
    id: link._id,
    updates: { disabled: true }
  });

  await assert.rejects(
    () => resolveRedirectTargetService('redirdisable1'),
    (err) => err.statusCode === 410
  );
});

test('redirect cache: expired entry re-reads Mongo', async () => {
  clearRedirectCache();
  await ShortUrl.create({
    short_url: 'redirexpire1',
    full_url: 'https://example.com/expire',
    canonical_url: 'https://example.com/expire',
    click: 0,
    disabled: false,
    retiredAt: null
  });

  let findCalls = 0;
  const originalFindOne = ShortUrl.findOne.bind(ShortUrl);
  ShortUrl.findOne = (...args) => {
    findCalls += 1;
    return originalFindOne(...args);
  };

  const realNow = Date.now;
  let offset = 0;
  Date.now = () => realNow() + offset;

  try {
    await resolveRedirectTargetService('redirexpire1');
    assert.equal(findCalls, 1);

    offset = REDIRECT_CACHE_TTL_MS_FOR_TESTS + 1;
    const again = await resolveRedirectTargetService('redirexpire1');
    assert.equal(again.cacheHit, false);
    assert.equal(findCalls, 2);
  } finally {
    Date.now = realNow;
    ShortUrl.findOne = originalFindOne;
    invalidateRedirectCache('redirexpire1');
  }
});
