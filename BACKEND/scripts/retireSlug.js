/**
 * Manual takedown: retire a short-link slug (clears destination, keeps tombstone).
 *
 * Usage (from BACKEND/):
 *   node scripts/retireSlug.js <slug>
 */
import mongoose from 'mongoose';
import ShortUrl from '../src/schema/shortUrl.model.js';
import { releaseActiveLinkSlots } from '../src/dao/user.dao.js';
import { deleteClicksForLinks } from '../src/dao/click.dao.js';
import { runWithTransaction } from '../src/utils/mongoTransaction.js';
import { findLinkBySlug, retireById } from '../src/dao/shortUrl.dao.js';

const slug = process.argv[2]?.trim();

if (!slug) {
  console.error('Usage: node scripts/retireSlug.js <slug>');
  process.exit(1);
}

if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI must be set');
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI);

try {
  const link = await findLinkBySlug(slug);
  if (!link) {
    console.error(`Slug not found: ${slug}`);
    process.exit(1);
  }
  if (link.retiredAt) {
    console.log(`Slug already retired: ${slug} (since ${link.retiredAt.toISOString()})`);
    process.exit(0);
  }

  const result = await runWithTransaction(async (session) => {
    const current = await ShortUrl.findById(link._id).session(session).select('user').lean();
    const retired = await retireById(link._id, session);
    if (retired.modifiedCount) {
      await deleteClicksForLinks([link._id], session);
      if (current?.user) await releaseActiveLinkSlots(current.user, 1, session);
    }
    return retired;
  });
  if (result.modifiedCount === 0) {
    console.error(`Failed to retire slug: ${slug}`);
    process.exit(1);
  }

  console.log(`Retired slug: ${slug}`);
} finally {
  await mongoose.disconnect();
}
