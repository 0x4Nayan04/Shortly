import {
  claimAnonymousLink,
  findAnonymousByIdAndToken,
  findOwnedDuplicateByCanonical,
  softDeleteById
} from '../../dao/shortUrl.dao.js';
import { hashEmailToken } from '../../utils/hashToken.js';
import { isUserAtLinkCapacity } from './linkCapacity.js';

const hashManageToken = (token) => hashEmailToken(token);

export async function claimAnonymousLinksService({ userId, claims }) {
  const claimed = [];
  const skipped = [];

  for (const { id, manage_token } of claims) {
    if (!id || !manage_token) {
      skipped.push({ id, reason: 'missing_id_or_token' });
      continue;
    }

    if (await isUserAtLinkCapacity(userId)) {
      skipped.push({ id, reason: 'link_limit_reached' });
      continue;
    }

    const doc = await findAnonymousByIdAndToken(
      id,
      hashManageToken(manage_token)
    );
    if (!doc) {
      skipped.push({ id, reason: 'not_found_or_invalid_token' });
      continue;
    }

    const ownedDuplicate = await findOwnedDuplicateByCanonical(
      userId,
      doc.canonical_url
    );
    if (ownedDuplicate) {
      await softDeleteById(doc._id);
      skipped.push({
        id,
        reason: 'duplicate_destination',
        short_url: doc.short_url
      });
      continue;
    }

    await claimAnonymousLink(doc._id, userId);
    claimed.push({ id, short_url: doc.short_url });
  }

  return { claimed, skipped };
}
