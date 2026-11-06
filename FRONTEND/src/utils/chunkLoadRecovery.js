export const CHUNK_RELOAD_STORAGE_KEY = 'shortly:chunk-reload-at';
export const CHUNK_RELOAD_COOLDOWN_MS = 10_000;

const CHUNK_LOAD_ERROR_RE =
  /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|ChunkLoadError/i;

export function isChunkLoadError(error) {
  const message = typeof error === 'string' ? error : error?.message;
  return typeof message === 'string' && CHUNK_LOAD_ERROR_RE.test(message);
}

function claimChunkReload(storage = sessionStorage, now = Date.now()) {
  try {
    const last = Number(storage.getItem(CHUNK_RELOAD_STORAGE_KEY) ?? 0);
    if (last > 0 && now - last < CHUNK_RELOAD_COOLDOWN_MS) return false;
    storage.setItem(CHUNK_RELOAD_STORAGE_KEY, String(now));
    return true;
  } catch {
    return false;
  }
}

/** Hard-reload once after a stale deploy chunk miss. */
export function reloadOnceForChunkError({
  storage = sessionStorage,
  reload = () => window.location.reload(),
  now = Date.now()
} = {}) {
  if (!claimChunkReload(storage, now)) return false;
  reload();
  return true;
}

/** Recover from Vite preload/chunk failures with a single hard reload. */
export function setupChunkLoadRecovery({
  storage = sessionStorage,
  reload = () => window.location.reload()
} = {}) {
  const onPreloadError = (event) => {
    if (!claimChunkReload(storage)) return;
    event.preventDefault();
    reload();
  };

  window.addEventListener('vite:preloadError', onPreloadError);
  return () => window.removeEventListener('vite:preloadError', onPreloadError);
}
