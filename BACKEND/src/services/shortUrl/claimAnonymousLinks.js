import {
  claimAnonymousLink,
  findAnonymousByIdAndToken,
  retireAnonymousByToken
} from '../../dao/shortUrl.dao.js';
import { hashEmailToken } from '../../utils/hashToken.js';
import {
  reserveActiveLinkSlot,
  releaseActiveLinkSlots
} from '../../dao/user.dao.js';
import { runWithTransaction } from '../../utils/mongoTransaction.js';

const hashManageToken = (token) => hashEmailToken(token);

export async function claimAnonymousLinksService({ userId, claims }) {
  const claimed = [];
  const skipped = [];

  for (const { id, manage_token } of claims) {
    if (!id || !manage_token) {
      skipped.push({ id, reason: 'missing_id_or_token' });
      continue;
    }

    const tokenHash = hashManageToken(manage_token);
    const doc = await findAnonymousByIdAndToken(id, tokenHash);
    if (!doc) {
      skipped.push({ id, reason: 'not_found_or_invalid_token' });
      continue;
    }

    try {
      const result = await runWithTransaction(async (session) => {
        const reserved = await reserveActiveLinkSlot(userId, session);
        if (!reserved) return { kind: 'capacity' };

        const claimedDoc = await claimAnonymousLink(
          doc._id,
          tokenHash,
          userId,
          session
        );
        if (!claimedDoc) {
          await releaseActiveLinkSlots(userId, 1, session);
          return { kind: 'lost_race' };
        }
        return { kind: 'claimed', doc: claimedDoc };
      });

      if (result.kind === 'capacity') {
        skipped.push({ id, reason: 'link_limit_reached' });
      } else if (result.kind === 'lost_race') {
        skipped.push({ id, reason: 'not_found_or_invalid_token' });
      } else {
        claimed.push({ id, short_url: result.doc.short_url });
      }
    } catch (error) {
      if (error.code !== 11000 || !error.keyPattern?.canonical_url) throw error;
      await retireAnonymousByToken(doc._id, tokenHash);
      skipped.push({
        id,
        reason: 'duplicate_destination',
        short_url: doc.short_url
      });
    }
  }

  return { claimed, skipped };
}
