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

test('active, retired, unknown redirects and QR responses are distinct', async () => {
  const agent = await register('redirects@example.com');
  const created = await agent
    .post('/api/create/custom')
    .set(origin)
    .send({ full_url: 'https://example.com/target', custom_url: 'kept-slug' });
  assert.equal(created.status, 201, created.text);

  const activeRedirect = await request(app).get('/kept-slug');
  assert.equal(activeRedirect.status, 302);
  assert.equal(activeRedirect.headers.location, 'https://example.com/target');
  assert.equal((await request(app).get('/api/qr/kept-slug')).status, 200);

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
  const retiredQr = await request(app).get('/api/qr/kept-slug');
  assert.equal(retiredQr.status, 410);
  assert.equal(retiredQr.body.message, 'This short link has been retired');
  assert.equal((await request(app).get('/missing-slug')).status, 404);
  assert.equal((await request(app).get('/api/qr/missing-slug')).status, 404);

  const reuse = await agent
    .post('/api/create/custom')
    .set(origin)
    .send({ full_url: 'https://example.com/new', custom_url: 'kept-slug' });
  assert.equal(reuse.status, 409);
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
