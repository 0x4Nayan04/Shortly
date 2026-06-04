/** Detailed click events are retained this many days (MongoDB TTL on Click.timestamp). */
export const CLICK_RETENTION_DAYS = 30;

/** Soft-deleted slugs cannot be reclaimed until this many days have passed. */
export const SLUG_RECLAIM_DAYS = parseInt(
  process.env.SLUG_RECLAIM_DAYS || '30',
  10
);

export const MAX_LINKS_PER_USER = parseInt(
  process.env.MAX_LINKS_PER_USER || '1000',
  10
);
