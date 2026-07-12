/**
 * Child process helper for process-local cache characterization.
 * Speaks one JSON line on stdout. Uses its own MongoMemoryReplSet.
 */
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET =
  process.env.JWT_SECRET || 'test-secret-that-is-at-least-thirty-two-characters';
process.env.FRONT_END_URL = 'http://frontend.test';
process.env.PUBLIC_BASE_URL = 'http://short.test';
process.env.PORT = '3001';
process.env.ALLOWED_ORIGINS = 'http://frontend.test';

const mode = process.env.CACHE_CHILD_MODE || 'auth-prime';

const replSet = await MongoMemoryReplSet.create({
  replSet: { count: 1, storageEngine: 'wiredTiger' }
});
await mongoose.connect(replSet.getUri(`cache_child_${process.pid}`));

const { default: User } = await import('../../src/schema/user.model.js');
const { default: ShortUrl } = await import('../../src/schema/shortUrl.model.js');
const { default: Click } = await import('../../src/schema/click.model.js');
const { signToken } = await import('../../src/utils/helper.js');
const {
  resolveUserFromToken,
  invalidateCachedAuthUser
} = await import('../../src/utils/authToken.js');
const {
  getStatsForUserService,
  invalidateStatsForUser
} = await import('../../src/services/shortUrl.services.js');

await Promise.all([
  User.syncIndexes(),
  ShortUrl.syncIndexes(),
  Click.syncIndexes()
]);

let findByIdCalls = 0;
const originalFindById = User.findById.bind(User);
User.findById = (...args) => {
  findByIdCalls += 1;
  return originalFindById(...args);
};

const email = `child-${mode}-${process.pid}@example.com`;
const user = await User.create({
  name: 'Child Cache',
  email,
  password: 'hashed-not-used'
});
const token = await signToken({
  id: user._id,
  tokenVersion: user.tokenVersion ?? 0
});

let aggregateCalls = 0;
const originalAggregate = Click.aggregate.bind(Click);
Click.aggregate = (...args) => {
  aggregateCalls += 1;
  return originalAggregate(...args);
};

try {
  if (mode === 'auth-prime' || mode === 'auth-hit-check') {
    await resolveUserFromToken({}, token);
    if (mode === 'auth-prime') {
      // Second call in same process should be a cache hit.
      const before = findByIdCalls;
      await resolveUserFromToken({}, token);
      if (findByIdCalls !== before) {
        throw new Error('expected in-process auth cache hit');
      }
    }
    console.log(
      JSON.stringify({
        mode,
        pid: process.pid,
        findByIdCalls,
        ok: true
      })
    );
  } else if (mode === 'stats-prime' || mode === 'stats-cold') {
    await ShortUrl.create({
      short_url: `c${process.pid}`.slice(0, 20),
      full_url: 'https://example.com/c',
      canonical_url: 'https://example.com/c',
      user: user._id,
      click: 0,
      disabled: false,
      retiredAt: null
    });
    invalidateStatsForUser(user._id);
    await getStatsForUserService({ userId: user._id });
    if (mode === 'stats-prime') {
      const before = aggregateCalls;
      await getStatsForUserService({ userId: user._id });
      if (aggregateCalls !== before) {
        throw new Error('expected in-process stats cache hit');
      }
    }
    console.log(
      JSON.stringify({
        mode,
        pid: process.pid,
        aggregateCalls,
        ok: true
      })
    );
  } else if (mode === 'memory-limiter') {
    const { memoryRateLimiter } =
      await import('../../src/middleware/rateLimit.middleware.js');
    const limiter = memoryRateLimiter({
      windowMs: 60_000,
      max: 2,
      keyGenerator: () => 'ip:child'
    });
    let ok = 0;
    let blocked = 0;
    for (let i = 0; i < 4; i++) {
      await new Promise((resolve) => {
        limiter(
          {},
          { setHeader() {} },
          (err) => {
            if (err) blocked += 1;
            else ok += 1;
            resolve();
          }
        );
      });
    }
    console.log(JSON.stringify({ mode, pid: process.pid, ok, blocked }));
  } else {
    throw new Error(`unknown mode ${mode}`);
  }
} finally {
  invalidateCachedAuthUser(user._id);
  User.findById = originalFindById;
  Click.aggregate = originalAggregate;
  await mongoose.disconnect();
  await replSet.stop();
}
