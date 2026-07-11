import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { migrateSlugTombstones } from '../scripts/migrateResumeReadiness.js';
import ShortUrl from '../src/schema/shortUrl.model.js';
import Click from '../src/schema/click.model.js';
import User from '../src/schema/user.model.js';
import {
  MIGRATION_COLLECTION,
  REQUIRED_MIGRATION_ID
} from '../src/constants/migrations.js';

let replSet;

test.before(async () => {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(replSet.getUri('migration_test'), {
    autoIndex: false
  });
});

test.beforeEach(async () => {
  await mongoose.connection.dropDatabase();
});

test('migration reconciles authenticated destination duplicates and user counters', async () => {
  const links = ShortUrl.collection;
  const users = User.collection;
  const indexes = await links.indexes().catch((error) => {
    if (error.code === 26) return [];
    throw error;
  });
  const canonicalIndex = indexes.find(
    (index) => index.key?.user === 1 && index.key?.canonical_url === 1
  );
  if (canonicalIndex) await links.dropIndex(canonicalIndex.name);

  const userId = new mongoose.Types.ObjectId();
  await users.insertOne({
    _id: userId,
    name: 'Legacy User',
    email: 'legacy@example.com',
    password: 'already-hashed',
    activeLinkCount: 99
  });
  await links.insertMany([
    {
      short_url: 'canonical-one',
      full_url: 'https://same.example/path',
      canonical_url: 'https://same.example/path',
      user: userId,
      click: 2,
      disabled: false,
      retiredAt: null
    },
    {
      short_url: 'canonical-two',
      full_url: 'https://same.example/path',
      canonical_url: 'https://same.example/path',
      user: userId,
      click: 5,
      disabled: false,
      retiredAt: null
    }
  ]);

  const report = await migrateSlugTombstones();
  assert.equal(report.canonicalDuplicatesRetired, 1);
  assert.equal(report.userTimestampsBackfilled, 1);
  assert.equal(report.linkCountersUpdated, 1);
  assert.equal(
    await links.countDocuments({ user: userId, retiredAt: null }),
    1
  );
  const retired = await links.findOne({ short_url: 'canonical-one' });
  assert.ok(retired.retiredAt);
  assert.equal(retired.user, undefined);
  const user = await users.findOne({ _id: userId });
  assert.equal(user.activeLinkCount, 1);
  assert.ok(user.createdAt);

  const second = await migrateSlugTombstones();
  assert.equal(second.canonicalDuplicatesRetired, 0);
  assert.equal(second.userTimestampsBackfilled, 0);
  assert.equal(second.linkCountersUpdated, 0);
  assert.ok(
    await mongoose.connection.db
      .collection(MIGRATION_COLLECTION)
      .findOne({ _id: REQUIRED_MIGRATION_ID })
  );
});

test.after(async () => {
  await mongoose.disconnect();
  await replSet.stop();
});

test('migration is idempotent, scrubs tombstones/referrers, and creates global uniqueness', async () => {
  const links = ShortUrl.collection;
  const clicks = Click.collection;
  const now = new Date();
  const old = new Date(now.getTime() - 86_400_000);
  const inserted = await links.insertMany([
    {
      short_url: 'active-wins',
      full_url: 'https://active.example',
      canonical_url: 'https://active.example/',
      click: 4,
      disabled: false,
      deletedAt: null,
      createdAt: old,
      updatedAt: old
    },
    {
      short_url: 'active-wins',
      full_url: 'https://old-secret.example/path?token=x',
      canonical_url: 'https://old-secret.example/path?token=x',
      click: 99,
      disabled: true,
      deletedAt: old,
      manage_token: 'hashed-secret',
      createdAt: old,
      updatedAt: old
    },
    {
      short_url: 'retired-only',
      full_url: 'https://private.example/a',
      canonical_url: 'https://private.example/a',
      click: 12,
      disabled: true,
      deletedAt: old,
      manage_token: 'another-secret',
      createdAt: old,
      updatedAt: old
    },
    {
      short_url: 'retired-only',
      full_url: 'https://private.example/b',
      canonical_url: 'https://private.example/b',
      click: 2,
      disabled: true,
      deletedAt: now,
      createdAt: now,
      updatedAt: now
    }
  ]);
  await clicks.insertMany([
    {
      short_url_id: inserted.insertedIds[0],
      referrer: 'https://User:secret@Example.COM:9443/path?q=token#fragment',
      timestamp: now
    },
    {
      short_url_id: inserted.insertedIds[2],
      referrer: 'https://sensitive.example/path',
      timestamp: now
    }
  ]);
  await links.createIndex(
    { short_url: 1 },
    {
      unique: true,
      partialFilterExpression: { deletedAt: null },
      name: 'legacy_slug'
    }
  );
  await links.createIndex(
    { deletedAt: 1 },
    { expireAfterSeconds: 7_776_000, name: 'legacy_deleted_ttl' }
  );

  const first = await migrateSlugTombstones();
  assert.deepEqual(first, {
    activeLinks: 1,
    tombstones: 1,
    duplicatesRemoved: 2,
    sanitizedReferrers: 1,
    canonicalDuplicatesRetired: 0,
    userTimestampsBackfilled: 0,
    linkCountersUpdated: 0,
    failures: 0
  });

  const active = await links.findOne({ short_url: 'active-wins' });
  assert.equal(active.full_url, 'https://active.example');
  assert.equal(active.retiredAt, null);
  assert.equal(active.deletedAt, undefined);
  const tombstone = await links.findOne({ short_url: 'retired-only' });
  assert.ok(tombstone.retiredAt);
  assert.equal(tombstone.full_url, undefined);
  assert.equal(tombstone.canonical_url, undefined);
  assert.equal(tombstone.manage_token, undefined);
  assert.equal(tombstone.click, 0);
  assert.equal(
    await clicks.countDocuments({ short_url_id: inserted.insertedIds[2] }),
    0
  );
  assert.equal(
    (await clicks.findOne({ short_url_id: inserted.insertedIds[0] })).referrer,
    'example.com'
  );

  const indexes = await links.indexes();
  const slugIndex = indexes.find((index) => index.name === 'short_url_1');
  assert.equal(slugIndex.unique, true);
  assert.equal(slugIndex.partialFilterExpression, undefined);
  assert.equal(
    indexes.some((index) => index.key.deletedAt),
    false
  );
  await assert.rejects(
    links.insertOne({
      short_url: 'retired-only',
      full_url: 'https://new.example'
    }),
    (error) => error.code === 11000
  );

  const second = await migrateSlugTombstones();
  assert.deepEqual(second, {
    activeLinks: 1,
    tombstones: 1,
    duplicatesRemoved: 0,
    sanitizedReferrers: 0,
    canonicalDuplicatesRetired: 0,
    userTimestampsBackfilled: 0,
    linkCountersUpdated: 0,
    failures: 0
  });
});
