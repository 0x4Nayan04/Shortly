export function normalizeSlug(slug) {
  if (typeof slug !== 'string') return '';
  return slug.trim().toLowerCase();
}
