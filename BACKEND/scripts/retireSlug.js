/**
 * Manual takedown: retire a short-link slug (clears destination, keeps tombstone).
 *
 * Usage (from BACKEND/):
 *   node scripts/retireSlug.js <slug>
 */
import mongoose from 'mongoose';
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

  const result = await retireById(link._id);
  if (result.modifiedCount === 0) {
    console.error(`Failed to retire slug: ${slug}`);
    process.exit(1);
  }

  console.log(`Retired slug: ${slug}`);
} finally {
  await mongoose.disconnect();
}
