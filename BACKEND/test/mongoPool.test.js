import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import mongoose from 'mongoose';
import { MongoMemoryReplSet, MongoMemoryServer } from 'mongodb-memory-server';
import { warmMongoPool } from '../src/config/mongo.config.js';

const eventNames = ['connectionReady', 'connectionCheckedOut', 'connectionClosed', 'connectionPoolCleared'];
const makeConnection = (command) => {
  const client = new EventEmitter();
  return { client, getClient: () => client, db: { admin: () => ({ command }) } };
};
const assertClean = (client) => {
  for (const event of eventNames) assert.equal(client.listenerCount(event), 0);
};

test('pool warmup requires four usable primary connections and removes its listeners', async () => {
  const connection = makeConnection(async (cmd) => cmd.hello ? { me: 'primary:27017' } : { ok: 1 });
  let done = false;
  const warming = warmMongoPool(connection).then(() => { done = true; });
  await new Promise(setImmediate);
  for (let id = 1; id <= 4; id++) connection.client.emit('connectionReady', { address: 'secondary:27017', connectionId: id });
  for (let id = 1; id <= 3; id++) connection.client.emit('connectionReady', { address: 'primary:27017', connectionId: id });
  await new Promise(setImmediate);
  assert.equal(done, false);
  connection.client.emit('connectionClosed', { address: 'primary:27017', connectionId: 2 });
  connection.client.emit('connectionReady', { address: 'primary:27017', connectionId: 4 });
  await new Promise(setImmediate);
  assert.equal(done, false);
  connection.client.emit('connectionReady', { address: 'primary:27017', connectionId: 5 });
  await warming;
  assertClean(connection.client);
});

test('warmup fails cleanly on command failure or timeout', async (t) => {
  const failed = makeConnection(async () => { throw new Error('database unavailable'); });
  await assert.rejects(warmMongoPool(failed), /database unavailable/);
  assertClean(failed.client);
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const stalled = makeConnection(async (cmd) => cmd.hello ? { me: 'primary:27017' } : { ok: 1 });
  const rejection = assert.rejects(warmMongoPool(stalled), /warmup timed out/);
  await new Promise(setImmediate);
  t.mock.timers.tick(30_000);
  await rejection;
  assertClean(stalled.client);
});

test('real replica-set warmup keeps four existing connections ready for first concurrent queries', async () => {
  const replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  let connection;
  try {
    connection = await mongoose.createConnection(replSet.getUri('pool_warmup'), { minPoolSize: 4, maxPoolSize: 10 }).asPromise();
    const client = connection.getClient();
    const created = new Set();
    client.on('connectionCreated', (event) => created.add(event.connectionId));
    await warmMongoPool(connection);
    created.clear();
    await Promise.all(Array.from({ length: 4 }, () => connection.db.admin().command({ ping: 1 })));
    assert.equal(created.size, 0);
  } finally {
    if (connection) await connection.close();
    await replSet.stop();
  }
});

test('warmup also supports an existing standalone MongoDB setup', async () => {
  const server = await MongoMemoryServer.create();
  let connection;
  try {
    connection = await mongoose.createConnection(server.getUri(), {
      minPoolSize: 4, maxPoolSize: 10
    }).asPromise();
    await warmMongoPool(connection);
    assert.equal((await connection.db.admin().command({ ping: 1 })).ok, 1);
  } finally {
    if (connection) await connection.close();
    await server.stop();
  }
});
