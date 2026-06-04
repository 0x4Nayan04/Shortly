import {
  isReservedSlug,
  RESERVED_SLUG_MESSAGE
} from '../constants/reservedSlugs.js';
import { normalizeSlug } from './normalizeSlug.js';

const CUSTOM_SLUG_MIN_LENGTH = 3;
const CUSTOM_SLUG_MAX_LENGTH = 20;

const CUSTOM_SLUG_PATTERN = /^[a-z0-9_-]+$/;

export function validateCustomSlug(slug) {
  const normalized = normalizeSlug(slug);

  if (
    !normalized ||
    normalized.length < CUSTOM_SLUG_MIN_LENGTH ||
    normalized.length > CUSTOM_SLUG_MAX_LENGTH
  ) {
    throw new Error('Custom URL must be between 3 and 20 characters long.');
  }

  if (!CUSTOM_SLUG_PATTERN.test(normalized)) {
    throw new Error(
      'Custom URL can only contain letters, numbers, hyphens, and underscores.'
    );
  }

  if (isReservedSlug(normalized)) {
    throw new Error(RESERVED_SLUG_MESSAGE);
  }

  return normalized;
}
