import crypto from 'crypto';

export function hashEmailToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}
