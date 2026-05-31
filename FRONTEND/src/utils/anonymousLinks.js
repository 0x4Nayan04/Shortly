const STORAGE_KEY = 'shortly_anonymous_links';

export function rememberAnonymousLink({ id, manage_token, short_url }) {
  if (!id || !manage_token) return;

  const existing = readAnonymousLinks().filter((link) => link.id !== id);
  existing.push({ id, manage_token, short_url });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing.slice(-50)));
}

export function readAnonymousLinks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function clearAnonymousLinksByIds(ids = []) {
  if (!ids.length) return;
  const processed = new Set(ids);
  const remaining = readAnonymousLinks().filter(
    (link) => !processed.has(link.id)
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
}
