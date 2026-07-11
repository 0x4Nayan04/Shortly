/** Detailed click events are retained this many days (MongoDB TTL on Click.timestamp). */
export const CLICK_RETENTION_DAYS = 30;

const rawMaxLinks = process.env.MAX_LINKS_PER_USER || '1000';
const parsedMaxLinks = Number(rawMaxLinks);
if (
  !Number.isInteger(parsedMaxLinks) ||
  parsedMaxLinks < 1 ||
  parsedMaxLinks > 100000
) {
  throw new Error('MAX_LINKS_PER_USER must be an integer between 1 and 100000');
}
export const MAX_LINKS_PER_USER = parsedMaxLinks;
