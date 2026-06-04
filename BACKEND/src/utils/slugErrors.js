import { AppError } from './errorHandler.js';

export const CUSTOM_SLUG_TAKEN_MESSAGE =
  'Custom short URL already exists. Please choose a different one.';

export async function withSlugConflictHandler(
  operation,
  message = CUSTOM_SLUG_TAKEN_MESSAGE
) {
  try {
    return await operation();
  } catch (err) {
    if (err?.code === 11000) {
      const fields = err.keyPattern ? Object.keys(err.keyPattern) : [];
      if (fields.length === 0 || fields.includes('short_url')) {
        throw new AppError(message, 409);
      }
    }
    throw err;
  }
}
