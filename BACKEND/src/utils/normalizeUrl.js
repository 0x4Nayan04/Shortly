import { AppError } from './errorHandler.js';

/**
 * Canonical form for duplicate detection. Preserves scheme, query, and hash;
 * lowercases hostname and trims trailing slashes on non-root paths.
 */
export function normalizeUrl(input) {
  if (typeof input !== 'string') {
    throw new AppError('Please provide a valid URL', 400);
  }

  const trimmed = input.trim();
  if (!trimmed) {
    throw new AppError('URL is required', 400);
  }

  let url;
  try {
    url = new URL(trimmed);
  } catch {
    throw new AppError(
      'Please provide a valid URL (must start with http:// or https://)',
      400
    );
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new AppError(
      'Please provide a valid URL (must start with http:// or https://)',
      400
    );
  }

  url.hostname = url.hostname.toLowerCase();

  if (
    (url.protocol === 'http:' && url.port === '80') ||
    (url.protocol === 'https:' && url.port === '443')
  ) {
    url.port = '';
  }

  if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
    url.pathname = url.pathname.slice(0, -1);
  }

  return url.toString();
}
