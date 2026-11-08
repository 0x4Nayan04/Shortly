import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-that-is-at-least-thirty-two-characters';
process.env.FRONT_END_URL = 'http://frontend.test';
process.env.PUBLIC_BASE_URL = 'http://short.test';
process.env.PORT = '3001';
process.env.ALLOWED_ORIGINS = 'http://frontend.test';

const { createApp } = await import('../src/app.js');
const { default: ShortUrl } = await import('../src/schema/shortUrl.model.js');
const { default: Click } = await import('../src/schema/click.model.js');
const { default: User } = await import('../src/schema/user.model.js');
const { default: RateLimit } = await import('../src/schema/rateLimit.model.js');
const { recordClickFromRequest } =
  await import('../src/services/click.service.js');
const { hashEmailToken } = await import('../src/utils/hashToken.js');

const origin = { Origin: 'http://frontend.test' };
const password = 'correct horse battery staple';
let replSet;
let app;

async function register(email) {
  const agent = request.agent(app);
  const response = await agent.post('/api/auth/register').send({
    name: 'Test User',
    email,
    password
  });
  assert.equal(response.status, 202, response.text);
  const login = await agent.post('/api/auth/login').send({ email, password });
  assert.equal(login.status, 200, login.text);
  return agent;
}

test.before(async () => {
  replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: 'wiredTiger' }
  });
  process.env.MONGODB_URI = replSet.getUri('shortly_test');
  await mongoose.connect(process.env.MONGODB_URI);
  await Promise.all([
    ShortUrl.syncIndexes(),
    Click.syncIndexes(),
    User.syncIndexes(),
    RateLimit.syncIndexes()
  ]);
  app = createApp();
});

test.after(async () => {
  await mongoose.disconnect();
  await replSet.stop();
});

test.beforeEach(async () => {
  await Promise.all([
    ShortUrl.deleteMany({}),
    Click.deleteMany({}),
    User.deleteMany({}),
    RateLimit.deleteMany({})
  ]);
});

test('anonymous creation always returns distinct links and claimable raw tokens', async () => {
  const first = await request(app)
    .post('/api/create')
    .send({ full_url: 'https://example.com/guest' });
  const second = await request(app)
    .post('/api/create')
    .send({ full_url: 'https://example.com/guest' });

  assert.equal(first.status, 201, first.text);
  assert.equal(second.status, 201, second.text);
  assert.equal(first.body.data.created, true);
  assert.equal(second.body.data.reused, false);
  assert.notEqual(first.body.data.short_url, second.body.data.short_url);
  assert.match(first.body.data.manage_token, /^[a-f0-9]{48}$/);
  assert.match(second.body.data.manage_token, /^[a-f0-9]{48}$/);

  const stored = await ShortUrl.findById(first.body.data.id)
    .select('+manage_token')
    .lean();
  assert.notEqual(stored.manage_token, first.body.data.manage_token);
  assert.equal(
    stored.manage_token,
    hashEmailToken(first.body.data.manage_token)
  );

  const agent = await register('claim@example.com');
  const claimed = await agent
    .post('/api/create/claim')
    .set(origin)
    .send({
      links: [
        {
          id: first.body.data.id,
          manage_token: first.body.data.manage_token
        }
      ]
    });
  assert.equal(claimed.status, 200, claimed.text);
  assert.equal(claimed.body.data.claimed.length, 1);
  const claimedDoc = await ShortUrl.findById(first.body.data.id)
    .select('+manage_token')
    .lean();
  assert.ok(claimedDoc.user);
  assert.equal(claimedDoc.manage_token, undefined);
});

test('authenticated creation remains idempotent', async () => {
  const agent = await register('dedupe@example.com');
  const [first, second] = await Promise.all([
    agent
      .post('/api/create')
      .set(origin)
      .send({ full_url: 'https://example.com/owned' }),
    agent
      .post('/api/create')
      .set(origin)
      .send({ full_url: 'https://example.com/owned' })
  ]);
  assert.deepEqual([first.status, second.status].sort(), [200, 201]);
  assert.equal(first.body.data.short_url, second.body.data.short_url);
  assert.equal(await ShortUrl.countDocuments({ retiredAt: null }), 1);
  const user = await User.findOne({ email: 'dedupe@example.com' }).lean();
  assert.equal(user.activeLinkCount, 1);
});

test('a management token can be claimed successfully only once under concurrency', async () => {
  const guest = await request(app)
    .post('/api/create')
    .send({ full_url: 'https://example.com/claim-race' });
  const firstAgent = await register('first-claim@example.com');
  const secondAgent = await register('second-claim@example.com');
  const payload = {
    links: [
      { id: guest.body.data.id, manage_token: guest.body.data.manage_token }
    ]
  };
  const responses = await Promise.all([
    firstAgent.post('/api/create/claim').set(origin).send(payload),
    secondAgent.post('/api/create/claim').set(origin).send(payload)
  ]);
  assert.equal(
    responses.reduce(
      (sum, response) => sum + response.body.data.claimed.length,
      0
    ),
    1
  );
  const owners = await User.find({ activeLinkCount: 1 }).countDocuments();
  assert.equal(owners, 1);
});

test('an emailed recovery token claims an anonymous link once and rejects reuse', async () => {
  const guest = await request(app)
    .post('/api/create')
    .send({ full_url: 'https://example.com/email-recovery' });
  const rawRecoveryToken = 'b'.repeat(64);
  await ShortUrl.updateOne(
    { _id: guest.body.data.id },
    {
      $set: {
        claim_recovery_token: hashEmailToken(rawRecoveryToken),
        claim_recovery_expires: new Date(Date.now() + 60_000)
      }
    }
  );
  const agent = await register('email-claim@example.com');

  const claimed = await agent
    .post('/api/create/claim/redeem')
    .set(origin)
    .send({ token: rawRecoveryToken });
  assert.equal(claimed.status, 200, claimed.text);
  assert.equal(claimed.body.data.link.id, guest.body.data.id);

  const reused = await agent
    .post('/api/create/claim/redeem')
    .set(origin)
    .send({ token: rawRecoveryToken });
  assert.equal(reused.status, 410, reused.text);

  const stored = await ShortUrl.findById(guest.body.data.id)
    .select('+manage_token +claim_recovery_token +claim_recovery_expires')
    .lean();
  assert.ok(stored.user);
  assert.equal(stored.manage_token, undefined);
  assert.equal(stored.claim_recovery_token, undefined);
  assert.equal(stored.claim_recovery_expires, undefined);
});

test('an expired emailed recovery token cannot claim a link', async () => {
  const guest = await request(app)
    .post('/api/create')
    .send({ full_url: 'https://example.com/expired-recovery' });
  const rawRecoveryToken = 'c'.repeat(64);
  await ShortUrl.updateOne(
    { _id: guest.body.data.id },
    {
      $set: {
        claim_recovery_token: hashEmailToken(rawRecoveryToken),
        claim_recovery_expires: new Date(Date.now() - 1_000)
      }
    }
  );
  const agent = await register('expired-claim@example.com');

  const response = await agent
    .post('/api/create/claim/redeem')
    .set(origin)
    .send({ token: rawRecoveryToken });
  assert.equal(response.status, 410, response.text);
  const stored = await ShortUrl.findById(guest.body.data.id).lean();
  assert.equal(stored.user, undefined);
});

test('registration is generic for new and existing emails and weak passwords fail', async () => {
  const payload = {
    name: 'Privacy Test',
    email: 'privacy@example.com',
    password
  };
  const first = await request(app).post('/api/auth/register').send(payload);
  const second = await request(app).post('/api/auth/register').send(payload);
  assert.equal(first.status, 202);
  assert.equal(second.status, 202);
  assert.deepEqual(first.body, second.body);
  const user = await User.findOne({ email: payload.email });
  assert.ok(user);
  const weak = await request(app).post('/api/auth/register').send({
    name: 'Weak Test',
    email: 'weak@example.com',
    password: 'short123'
  });
  assert.equal(weak.status, 400);
});

test('concurrent same-email registrations remain generic', async () => {
  const payload = {
    name: 'Concurrent User',
    email: 'concurrent-register@example.com',
    password
  };
  const responses = await Promise.all([
    request(app).post('/api/auth/register').send(payload),
    request(app).post('/api/auth/register').send(payload)
  ]);
  assert.deepEqual(
    responses.map((response) => response.status),
    [202, 202]
  );
  assert.deepEqual(responses[0].body, responses[1].body);
  assert.equal(await User.countDocuments({ email: payload.email }), 1);
});

test('login has an IP-wide limit and logout revokes the old token', async () => {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: `missing-${attempt}@example.com`,
        password
      });
    assert.equal(response.status, 401);
  }
  const limited = await request(app).post('/api/auth/login').send({
    email: 'one-more@example.com',
    password
  });
  assert.equal(limited.status, 429);

  await RateLimit.deleteMany({});
  const email = 'revoke@example.com';
  await request(app).post('/api/auth/register').send({
    name: 'Revoke User',
    email,
    password
  });
  const login = await request(app)
    .post('/api/auth/login')
    .send({ email, password });
  const cookie = login.headers['set-cookie'][0].split(';')[0];
  assert.equal(
    (await request(app).get('/api/create/my-urls').set('Cookie', cookie))
      .status,
    200
  );
  const logout = await request(app)
    .post('/api/auth/logout')
    .set(origin)
    .set('Cookie', cookie);
  assert.equal(logout.status, 200);
  assert.equal(
    (await request(app).get('/api/create/my-urls').set('Cookie', cookie))
      .status,
    401
  );
});

test('active, retired, and unknown redirects are distinct', async () => {
  const agent = await register('redirects@example.com');
  const created = await agent
    .post('/api/create/custom')
    .set(origin)
    .send({ full_url: 'https://example.com/target', custom_url: 'kept-slug' });
  assert.equal(created.status, 201, created.text);

  const activeRedirect = await request(app).get('/kept-slug');
  assert.equal(activeRedirect.status, 302);
  assert.equal(activeRedirect.headers.location, 'https://example.com/target');

  const disabled = await agent.patch(`/api/create/${created.body.data.id}`)
    .set(origin).send({ disabled: true });
  assert.equal(disabled.status, 200, disabled.text);
  const disabledPage = await request(app).get('/kept-slug').set('Accept', 'text/html');
  assert.equal(disabledPage.status, 410);
  assert.match(disabledPage.text, /This link is unavailable/);

  const removed = await agent
    .delete(`/api/create/${created.body.data.id}`)
    .set(origin);
  assert.equal(removed.status, 200, removed.text);

  const tombstone = await ShortUrl.findById(created.body.data.id)
    .select('+manage_token')
    .lean();
  assert.ok(tombstone.retiredAt);
  assert.equal(tombstone.disabled, true);
  assert.equal(tombstone.click, 0);
  assert.equal(tombstone.full_url, undefined);
  assert.equal(tombstone.canonical_url, undefined);
  assert.equal(tombstone.user, undefined);
  assert.equal(tombstone.manage_token, undefined);

  const retiredRedirect = await request(app).get('/kept-slug');
  assert.equal(retiredRedirect.status, 410);
  assert.equal(
    retiredRedirect.body.message,
    'This short link has been retired'
  );
  assert.equal((await request(app).get('/missing-slug')).status, 404);
  const missingPage = await request(app).get('/missing-slug').set('Accept', 'text/html');
  assert.equal(missingPage.status, 404);
  assert.match(missingPage.text, /This link is unavailable/);
  const retiredPage = await request(app).get('/kept-slug').set('Accept', 'text/html');
  assert.equal(retiredPage.status, 410);
  assert.match(retiredPage.text, /This link is unavailable/);

  const reuse = await agent
    .post('/api/create/custom')
    .set(origin)
    .send({ full_url: 'https://example.com/new', custom_url: 'kept-slug' });
  assert.equal(reuse.status, 409);
});

test('new aliases require an alphanumeric first character while legacy links remain usable', async () => {
  const agent = await register('alias-validation@example.com');
  for (const alias of ['-leading', '_leading']) {
    const response = await agent.post('/api/create/custom').set(origin)
      .send({ full_url: 'https://example.com/test', custom_url: alias });
    assert.equal(response.status, 400);
  }
  const user = await User.findOne({ email: 'alias-validation@example.com' }).lean();
  const legacy = await ShortUrl.create({ short_url: '-legacy', full_url: 'https://example.com/old', canonical_url: 'https://example.com/old', user: user._id });
  assert.equal((await request(app).get('/-legacy')).status, 302);
  const edited = await agent.patch(`/api/create/${legacy._id}`).set(origin).send({ full_url: 'https://example.com/new' });
  assert.equal(edited.status, 200, edited.text);
  const invalidRename = await agent.patch(`/api/create/${legacy._id}`).set(origin).send({ short_url: '-new' });
  assert.equal(invalidRename.status, 400);
});

test('late click after link deletion does not restore counter or insert click docs', async () => {
  const agent = await register('late-click@example.com');
  const created = await agent
    .post('/api/create/custom')
    .set(origin)
    .send({
      full_url: 'https://example.com/late-click',
      custom_url: 'late-slug'
    });
  assert.equal(created.status, 201, created.text);
  const linkId = created.body.data.id;

  await recordClickFromRequest({
    shortUrlId: linkId,
    req: {
      headers: { 'user-agent': 'Mozilla/5.0' },
      get: () => '',
      ip: '203.0.113.20'
    }
  });
  const activeDoc = await ShortUrl.findById(linkId).lean();
  assert.equal(activeDoc.click, 1);
  assert.equal(await Click.countDocuments({ short_url_id: linkId }), 1);

  const removed = await agent
    .delete(`/api/create/${linkId}`)
    .set(origin);
  assert.equal(removed.status, 200, removed.text);

  const tombstone = await ShortUrl.findById(linkId).lean();
  assert.equal(tombstone.click, 0);
  assert.ok(tombstone.retiredAt);

  const recorded = await recordClickFromRequest({
    shortUrlId: linkId,
    req: {
      headers: { 'user-agent': 'Mozilla/5.0' },
      get: () => '',
      ip: '203.0.113.21'
    }
  });
  assert.equal(recorded, true);

  const afterLateClick = await ShortUrl.findById(linkId).lean();
  assert.equal(afterLateClick.click, 0);
  assert.equal(await Click.countDocuments({ short_url_id: linkId }), 0);
});

test('account deletion removes personal data and clicks but preserves tombstones', async () => {
  const agent = await register('delete@example.com');
  const created = await agent.post('/api/create/custom').set(origin).send({
    full_url: 'https://example.com/private',
    custom_url: 'account-slug'
  });
  const linkId = created.body.data.id;
  await recordClickFromRequest({
    shortUrlId: linkId,
    req: {
      headers: { 'user-agent': 'Mozilla/5.0' },
      get: (name) =>
        name.toLowerCase() === 'referer'
          ? 'https://User:pass@News.Example.COM:8443/a?q=secret#part'
          : '',
      ip: '203.0.113.10'
    }
  });
  const click = await Click.findOne({ short_url_id: linkId }).lean();
  assert.equal(click.referrer, 'news.example.com');

  const csrfRejected = await agent.delete('/api/auth/me');
  assert.equal(csrfRejected.status, 403);
  const wrongPassword = await agent
    .delete('/api/auth/me')
    .set(origin)
    .send({ password: 'incorrect password' });
  assert.equal(wrongPassword.status, 401);
  const deleted = await agent
    .delete('/api/auth/me')
    .set(origin)
    .send({ password });
  assert.equal(deleted.status, 200, deleted.text);
  assert.equal(await User.countDocuments({}), 0);
  assert.equal(await Click.countDocuments({}), 0);

  const tombstone = await ShortUrl.findById(linkId).lean();
  assert.equal(tombstone.short_url, 'account-slug');
  assert.ok(tombstone.retiredAt);
  assert.equal(tombstone.full_url, undefined);
  assert.equal((await request(app).get('/account-slug')).status, 410);

  const nextOwner = await register('next-owner@example.com');
  const reuse = await nextOwner.post('/api/create/custom').set(origin).send({
    full_url: 'https://example.com/takeover',
    custom_url: 'account-slug'
  });
  assert.equal(reuse.status, 409);
});

test('health, validation, auth, CORS, and public URL safety have smoke coverage', async () => {
  assert.equal((await request(app).get('/api/health')).status, 200);
  const me = await request(app).get('/api/auth/me');
  assert.equal(me.status, 200);
  assert.equal(me.body.data.user, null);
  assert.equal(me.headers['cache-control'], 'no-store');

  const invalid = await request(app)
    .post('/api/create')
    .send({ full_url: 'not-a-url' });
  assert.equal(invalid.status, 400);
  for (const full_url of ['http://127.0.0.1/private', 'http://[::1]/private']) {
    const response = await request(app).post('/api/create').send({ full_url });
    assert.equal(response.status, 400, full_url);
  }
  const publicUrl = await request(app)
    .post('/api/create')
    .send({ full_url: 'https://example.org/path' });
  assert.equal(publicUrl.status, 201, publicUrl.text);

  const cors = await request(app)
    .options('/api/create')
    .set('Origin', 'https://evil.example')
    .set('Access-Control-Request-Method', 'POST');
  assert.equal(cors.status, 403);
});

test('create, stats, and claim use independent counters and windows', async () => {
  const agent = await register('policy-isolation@example.com');
  const user = await User.findOne({ email: 'policy-isolation@example.com' });
  const first = await agent.post('/api/create').set(origin)
    .send({ full_url: 'https://example.com/policy-one' });
  assert.equal(first.status, 201);
  const stats = await agent.get('/api/create/stats');
  const analytics = await agent.get('/api/create/stats/analytics');
  assert.equal(stats.status, 200);
  assert.equal(analytics.status, 200);
  const claimed = await agent.post('/api/create/claim').set(origin).send({
    links: [{ id: new mongoose.Types.ObjectId().toString(), manage_token: 'a'.repeat(48) }]
  });
  assert.equal(claimed.status, 200);
  const createKey = `create-authenticated:user:${user._id}`;
  const statsKey = `stats:user:${user._id}`;
  const claimKey = `claim:user:${user._id}`;
  const createBucket = await RateLimit.findOne({ key: createKey });
  const statsBucket = await RateLimit.findOne({ key: statsKey });
  const claimBucket = await RateLimit.findOne({ key: claimKey });
  assert.equal(createBucket.count, 1);
  assert.equal(statsBucket.count, 2);
  assert.equal(claimBucket.count, 1);
  assert.ok(createBucket.expires_at - statsBucket.expires_at > 230_000);
  await RateLimit.updateOne({ key: statsKey }, { $set: { count: 30 } });
  const limited = await agent.get('/api/create/stats');
  assert.equal(limited.status, 429);
  assert.ok(Number(limited.headers['retry-after']) > 0);
  const second = await agent.post('/api/create').set(origin)
    .send({ full_url: 'https://example.com/policy-two' });
  assert.equal(second.status, 201);
  const updatedCreateBucket = await RateLimit.findOne({ key: createKey });
  assert.equal(updatedCreateBucket.count, 2);
  assert.equal(+updatedCreateBucket.expires_at, +createBucket.expires_at);
});

test('concurrent requests cannot exceed one rate-limit policy budget', async () => {
  const agent = await register('policy-concurrency@example.com');
  const user = await User.findOne({ email: 'policy-concurrency@example.com' });
  await RateLimit.create({ key: `stats:user:${user._id}`, count: 29,
    expires_at: new Date(Date.now() + 60_000) });
  const responses = await Promise.all([
    agent.get('/api/create/stats'), agent.get('/api/create/stats/analytics')
  ]);
  assert.deepEqual(responses.map((res) => res.status).sort(), [200, 429]);
});

test('updated links return saved values and ownership, conflicts, and redirect invalidation hold', async () => {
  const owner = await register('edit-owner@example.com');
  const other = await register('edit-other@example.com');
  const created = await owner.post('/api/create/custom').set(origin).send({
    full_url: 'https://example.com/edit-before', custom_url: 'edit-before'
  });
  const id = created.body.data.id;
  const resolveRedirect = (await import('../src/services/shortUrl/redirect.js')).resolveRedirectTargetService;
  await resolveRedirect('edit-before');
  const denied = await other.patch(`/api/create/${id}`).set(origin).send({ disabled: true });
  assert.equal(denied.status, 404);
  const edited = await owner.patch(`/api/create/${id}`).set(origin).send({
    full_url: 'https://example.com/edit-after', short_url: 'edit-after'
  });
  assert.equal(edited.status, 200);
  assert.equal(edited.body.data.url.full_url, 'https://example.com/edit-after');
  assert.equal(edited.body.data.url.short_url, 'edit-after');
  await assert.rejects(resolveRedirect('edit-before'));
  assert.equal((await resolveRedirect('edit-after')).data.full_url, 'https://example.com/edit-after');
  const disabled = await owner.patch(`/api/create/${id}`).set(origin).send({ disabled: true });
  assert.equal(disabled.body.data.url.disabled, true);
  await assert.rejects(resolveRedirect('edit-after'), /disabled/);
  const enabled = await owner.patch(`/api/create/${id}`).set(origin).send({ disabled: false });
  assert.equal(enabled.body.data.url.disabled, false);
  assert.equal((await resolveRedirect('edit-after')).data.disabled, false);
  await owner.post('/api/create/custom').set(origin).send({
    full_url: 'https://example.com/occupied', custom_url: 'edit-occupied'
  });
  const conflict = await owner.patch(`/api/create/${id}`).set(origin)
    .send({ short_url: 'edit-occupied' });
  assert.equal(conflict.status, 409);
  assert.equal((await ShortUrl.findById(id)).short_url, 'edit-after');
  await owner.delete(`/api/create/${id}`).set(origin);
  const retired = await owner.patch(`/api/create/${id}`).set(origin)
    .send({ disabled: false });
  assert.equal(retired.status, 404);
});

test('concurrent creation preserves the active-link cap and canonical reuse', async () => {
  const { MAX_LINKS_PER_USER } = await import('../src/constants/shortUrlLimits.js');
  const agent = await register('capacity-performance@example.com');
  const user = await User.findOne({ email: 'capacity-performance@example.com' });
  await User.updateOne({ _id: user._id }, { $set: { activeLinkCount: MAX_LINKS_PER_USER - 1 } });
  const responses = await Promise.all([1, 2].map((i) => agent.post('/api/create').set(origin)
    .send({ full_url: `https://example.com/capacity-${i}` })));
  assert.deepEqual(responses.map((r) => r.status).sort(), [201, 403]);
  assert.equal((await User.findById(user._id)).activeLinkCount, MAX_LINKS_PER_USER);
  const created = responses.find((r) => r.status === 201);
  const reused = await agent.post('/api/create').set(origin)
    .send({ full_url: created.body.data.full_url });
  assert.equal(reused.status, 200);
  assert.equal(reused.body.data.reused, true);
  assert.equal((await User.findById(user._id)).activeLinkCount, MAX_LINKS_PER_USER);
});

test('index repair preserves legacy indexes and enforces global slugs and active destinations', async () => {
  const { repairShortUrlIndexes } = await import('../scripts/repairShortUrlIndexes.js');
  const collection = mongoose.connection.db.collection('legacy_index_fixture');
  const user = new mongoose.Types.ObjectId();
  await collection.insertMany(Array.from({ length: 59 }, (_, i) => ({
    short_url: `fixture-${i}`, canonical_url: `https://example.com/fixture-${i}`, user, retiredAt: null
  })));
  await collection.insertOne({ short_url: 'legacy-one', canonical_url: 'https://example.com/one', user, retiredAt: null });
  await collection.createIndex({ short_url: 1 }, { unique: true, partialFilterExpression: { deletedAt: null } });
  await collection.createIndex({ user: 1, canonical_url: 1 });
  const before = await collection.find({ short_url: 'legacy-one' }).limit(1).explain('executionStats');
  assert.ok(JSON.stringify(before.queryPlanner.winningPlan).includes('COLLSCAN'));
  assert.equal(before.executionStats.totalDocsExamined, 60);
  const inspected = await repairShortUrlIndexes(collection);
  assert.equal(inspected.blocked, false);
  assert.equal(inspected.planned.length, 2);
  assert.equal(inspected.built.length, 0);
  assert.equal((await collection.indexes()).length, 3);
  const applied = await repairShortUrlIndexes(collection, { apply: true });
  assert.equal(applied.built.length, 2);
  assert.equal((await collection.indexes()).length, 5);
  const after = await collection.find({ short_url: 'legacy-one' }).limit(1).explain('executionStats');
  assert.ok(JSON.stringify(after.queryPlanner.winningPlan).includes('IXSCAN'));
  assert.equal(after.executionStats.totalDocsExamined, 1);
  const repeated = await repairShortUrlIndexes(collection, { apply: true });
  assert.equal(repeated.blocked, false);
  assert.equal(repeated.built.length, 0);
  await assert.rejects(collection.insertOne({ short_url: 'legacy-one', deletedAt: new Date() }), { code: 11000 });
  await assert.rejects(collection.insertOne({ short_url: 'another', canonical_url: 'https://example.com/one', user, retiredAt: null }), { code: 11000 });
  await collection.insertOne({ short_url: 'retired', canonical_url: 'https://example.com/one', user, retiredAt: new Date() });
});

test('index repair refuses duplicates and same-name conflicts without modifying data', async () => {
  const { repairShortUrlIndexes } = await import('../scripts/repairShortUrlIndexes.js');
  const collection = mongoose.connection.db.collection('duplicate_index_fixture');
  const user = new mongoose.Types.ObjectId();
  await collection.insertMany([1, 2].map(() => ({ short_url: 'duplicate', canonical_url: 'https://example.com/same', user, retiredAt: null })));
  const report = await repairShortUrlIndexes(collection, { apply: true });
  assert.equal(report.blocked, true);
  assert.deepEqual(report.duplicates, { slugs: 1, activeDestinations: 1 });
  assert.equal(report.built.length, 0);
  assert.equal(await collection.countDocuments(), 2);
  assert.equal((await collection.indexes()).length, 1);
  await collection.deleteMany({});
  await collection.createIndex({ short_url: 1 }, { name: 'short_url_global_unique', unique: true, partialFilterExpression: { deletedAt: null } });
  const conflicting = await repairShortUrlIndexes(collection, { apply: true });
  assert.equal(conflicting.blocked, true);
  assert.deepEqual(conflicting.conflicts, ['short_url_global_unique']);
  assert.equal(conflicting.built.length, 0);
});


test('single and bulk retirement delete clicks before subsequent account deletion', async () => {
  const agent = await register('retirement-privacy@example.com');
  const ids = [];
  for (const slug of ['private-one', 'private-two', 'private-three']) {
    const response = await agent.post('/api/create/custom').set(origin).send({
      full_url: `https://example.com/${slug}`, custom_url: slug
    });
    assert.equal(response.status, 201, response.text);
    ids.push(response.body.data.id);
    await recordClickFromRequest({ shortUrlId: response.body.data.id, req: {
      headers: { 'user-agent': 'Mozilla/5.0' }, get: () => '', ip: '203.0.113.1'
    } });
  }
  const user = await User.findOne({ email: 'retirement-privacy@example.com' }).lean();
  const { softDeleteLinkService, softDeleteLinksService } = await import('../src/services/shortUrl.services.js');
  const { deleteAccountService } = await import('../src/services/account.service.js');
  await softDeleteLinkService({ userId: user._id, id: ids[0] });
  const bulk = await softDeleteLinksService({ userId: user._id, ids: ids.slice(1) });
  assert.equal(bulk.deletedCount, 2);
  assert.equal(await Click.countDocuments({ short_url_id: { $in: ids } }), 0);
  assert.equal((await User.findById(user._id)).activeLinkCount, 0);
  await deleteAccountService({ userId: user._id, password });
  assert.equal(await User.countDocuments({ _id: user._id }), 0);
  assert.equal(await Click.countDocuments({ short_url_id: { $in: ids } }), 0);
  assert.equal(await ShortUrl.countDocuments({ _id: { $in: ids }, retiredAt: { $ne: null }, user: { $exists: false } }), 3);
});

test('concurrent click and retirement leave no click data', async () => {
  const agent = await register('retirement-race@example.com');
  const created = await agent.post('/api/create/custom').set(origin).send({
    full_url: 'https://example.com/race', custom_url: 'privacy-race'
  });
  const id = created.body.data.id;
  const req = { headers: { 'user-agent': 'Mozilla/5.0' }, get: () => '', ip: '203.0.113.2' };
  const [removed] = await Promise.all([
    agent.delete(`/api/create/${id}`).set(origin),
    ...Array.from({ length: 5 }, () => recordClickFromRequest({ shortUrlId: id, req }))
  ]);
  assert.equal(removed.status, 200, removed.text);
  assert.equal(await Click.countDocuments({ short_url_id: id }), 0);
  assert.equal((await ShortUrl.findById(id)).click, 0);
});

test('retirement rolls back link and counter when click deletion fails', async () => {
  const agent = await register('retirement-rollback@example.com');
  const created = await agent.post('/api/create/custom').set(origin).send({
    full_url: 'https://example.com/rollback', custom_url: 'privacy-rollback'
  });
  const id = created.body.data.id;
  const user = await User.findOne({ email: 'retirement-rollback@example.com' }).lean();
  const { softDeleteLinkService } = await import('../src/services/shortUrl.services.js');
  const original = Click.deleteMany;
  Click.deleteMany = () => { throw new Error('simulated deletion failure'); };
  try {
    await assert.rejects(softDeleteLinkService({ userId: user._id, id }), /simulated deletion failure/);
  } finally {
    Click.deleteMany = original;
  }
  const link = await ShortUrl.findById(id).lean();
  assert.equal(link.retiredAt, null);
  assert.equal(link.user.toString(), user._id.toString());
  assert.equal((await User.findById(user._id)).activeLinkCount, 1);
});
