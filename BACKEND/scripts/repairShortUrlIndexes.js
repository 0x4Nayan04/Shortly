import 'dotenv/config';
import { pathToFileURL } from 'node:url';
import mongoose from 'mongoose';
import ShortUrl from '../src/schema/shortUrl.model.js';

const integrityIndexes = ShortUrl.schema.indexes().filter(([, options]) =>
  ['short_url_global_unique', 'user_active_canonical_unique'].includes(options.name)
);

async function duplicateGroups(collection, match, group) {
  const [result] = await collection.aggregate([
    { $match: match },
    { $group: { _id: group, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
    { $count: 'groups' }
  ]).toArray();
  return result?.groups ?? 0;
}


export async function repairShortUrlIndexes(collection, { apply = false } = {}) {
  const existing = await collection.indexes();
  const duplicates = {
    slugs: await duplicateGroups(collection, {}, '$short_url'),
    activeDestinations: await duplicateGroups(collection, {
      user: { $type: 'objectId' }, canonical_url: { $type: 'string' }, retiredAt: null
    }, { user: '$user', canonical_url: '$canonical_url' })
  };
  const planned = integrityIndexes.filter(([, options]) =>
    !existing.some((index) => index.name === options.name)
  );

  const conflicts = integrityIndexes.filter(([key, options]) => {
    const actual = existing.find((index) => index.name === options.name);
    return actual && (
      JSON.stringify(actual.key) !== JSON.stringify(key) || !actual.unique ||
      JSON.stringify(actual.partialFilterExpression) !== JSON.stringify(options.partialFilterExpression) ||
      actual.sparse === true || actual.hidden === true || Boolean(actual.collation)
    );
  }).map(([, options]) => options.name);
  const blocked = duplicates.slugs > 0 || duplicates.activeDestinations > 0 || conflicts.length > 0;
  const report = { mode: apply ? 'apply' : 'inspect', blocked, duplicates, conflicts,
    planned: planned.map(([key, options]) => ({ key, ...options })), built: [] };
  if (apply && !blocked) {
    for (const [key, options] of planned) {
      await collection.createIndex(key, options);
      report.built.push(options.name);
    }
  }
  return report;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  let client;
  try {
    const args = process.argv.slice(2);
    if (args.some((arg) => arg !== '--apply')) throw new Error('Use no arguments to inspect, or --apply to build');
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required');
    client = new mongoose.mongo.MongoClient(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10_000
    });
    await client.connect();
    const report = await repairShortUrlIndexes(client.db().collection(ShortUrl.collection.name), {
      apply: args.includes('--apply')
    });
    report.target = {
      database: client.db().databaseName,
      host: client.options.srvHost ?? client.options.hosts.map(String).join(',')
    };
    console.log(JSON.stringify(report, null, 2));
    if (report.blocked) process.exitCode = 1;
  } catch (error) {

    console.error(JSON.stringify({ status: 'failed', errorType: error.name,
      code: error.code ?? null,
      note: 'No data or existing indexes were removed. Any completed index builds remain in place.' }));
    process.exitCode = 1;
  } finally {
    if (client) await client.close();
  }
}
