import crypto from 'crypto';
import {
  claimAnonymousLinkByRecoveryToken,
  clearAnonymousClaimRecoveryToken,
  findAnonymousByIdAndToken,
  findAnonymousByRecoveryToken,
  setAnonymousClaimRecoveryToken
} from '../../dao/shortUrl.dao.js';
import {
  reserveActiveLinkSlot,
  releaseActiveLinkSlots
} from '../../dao/user.dao.js';
import { sendAnonymousLinkRecoveryEmail } from '../email.service.js';
import { hashEmailToken } from '../../utils/hashToken.js';
import { AppError } from '../../utils/errorHandler.js';
import { runWithTransaction } from '../../utils/mongoTransaction.js';
import { buildPublicShortUrl } from '../../utils/publicShortUrl.js';

const RECOVERY_TTL_MS = 24 * 60 * 60 * 1000;
const createRawToken = () => crypto.randomBytes(32).toString('hex');

export async function emailAnonymousClaimRecoveryService({
  id,
  manageToken,
  email
}) {
  const manageTokenHash = hashEmailToken(manageToken);
  const link = await findAnonymousByIdAndToken(id, manageTokenHash);
  if (!link) {
    throw new AppError('This anonymous link can no longer be recovered.', 404);
  }

  const rawRecoveryToken = createRawToken();
  const recoveryTokenHash = hashEmailToken(rawRecoveryToken);
  const expiresAt = new Date(Date.now() + RECOVERY_TTL_MS);
  const updated = await setAnonymousClaimRecoveryToken(
    id,
    manageTokenHash,
    recoveryTokenHash,
    expiresAt
  );
  if (updated.modifiedCount !== 1) {
    throw new AppError('This anonymous link can no longer be recovered.', 409);
  }

  try {
    await sendAnonymousLinkRecoveryEmail(
      email,
      rawRecoveryToken,
      buildPublicShortUrl(link.short_url)
    );
  } catch (error) {
    await clearAnonymousClaimRecoveryToken(id, recoveryTokenHash);
    throw error;
  }
}

export async function redeemAnonymousClaimRecoveryService({
  userId,
  recoveryToken
}) {
  const recoveryTokenHash = hashEmailToken(recoveryToken);
  const link = await findAnonymousByRecoveryToken(recoveryTokenHash);
  if (!link) {
    throw new AppError('This recovery link is invalid, expired, or already used.', 410);
  }

  try {
    const claimed = await runWithTransaction(async (session) => {
      const reserved = await reserveActiveLinkSlot(userId, session);
      if (!reserved) {
        throw new AppError('Link limit reached. Delete unused links first.', 403);
      }
      const result = await claimAnonymousLinkByRecoveryToken(
        link._id,
        recoveryTokenHash,
        userId,
        session
      );
      if (!result) {
        await releaseActiveLinkSlots(userId, 1, session);
        throw new AppError(
          'This recovery link is invalid, expired, or already used.',
          410
        );
      }
      return result;
    });
    return { id: claimed._id.toString(), short_url: claimed.short_url };
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.canonical_url) {
      throw new AppError(
        'Your account already has a short link for this destination.',
        409
      );
    }
    throw error;
  }
}
