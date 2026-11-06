import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CHUNK_RELOAD_COOLDOWN_MS,
  CHUNK_RELOAD_STORAGE_KEY,
  isChunkLoadError,
  reloadOnceForChunkError,
  setupChunkLoadRecovery
} from './chunkLoadRecovery.js';

function memoryStorage(seed = {}) {
  const data = { ...seed };
  return {
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => {
      data[key] = String(value);
    },
    raw: data
  };
}

describe('isChunkLoadError', () => {
  it.each([
    'Failed to fetch dynamically imported module: http://x/assets/a.js',
    'Importing a module script failed.',
    'error loading dynamically imported module',
    'ChunkLoadError: Loading chunk 3 failed.'
  ])('detects %s', (message) => {
    expect(isChunkLoadError(new Error(message))).toBe(true);
  });

  it('ignores unrelated errors', () => {
    expect(isChunkLoadError(new Error('Cannot read properties of null'))).toBe(
      false
    );
  });
});

describe('reloadOnceForChunkError', () => {
  it('reloads once and guards a second attempt inside the cooldown', () => {
    const storage = memoryStorage();
    const reload = vi.fn();
    const now = 1_000_000;

    expect(reloadOnceForChunkError({ storage, reload, now })).toBe(true);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(storage.raw[CHUNK_RELOAD_STORAGE_KEY]).toBe(String(now));

    expect(
      reloadOnceForChunkError({
        storage,
        reload,
        now: now + CHUNK_RELOAD_COOLDOWN_MS - 1
      })
    ).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('allows another reload after the cooldown', () => {
    const now = 1_000_000;
    const storage = memoryStorage({
      [CHUNK_RELOAD_STORAGE_KEY]: String(now)
    });
    const reload = vi.fn();

    expect(
      reloadOnceForChunkError({
        storage,
        reload,
        now: now + CHUNK_RELOAD_COOLDOWN_MS
      })
    ).toBe(true);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('skips reload when the guard cannot be written', () => {
    const reload = vi.fn();
    expect(
      reloadOnceForChunkError({
        storage: {
          getItem: () => null,
          setItem: () => {
            throw new Error('quota');
          }
        },
        reload
      })
    ).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });
});

describe('setupChunkLoadRecovery', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('prevents default and reloads on vite:preloadError', () => {
    const handlers = new Map();
    vi.spyOn(window, 'addEventListener').mockImplementation((type, handler) => {
      handlers.set(type, handler);
    });
    vi.spyOn(window, 'removeEventListener').mockImplementation((type) => {
      handlers.delete(type);
    });

    const storage = memoryStorage();
    const reload = vi.fn();
    const stop = setupChunkLoadRecovery({ storage, reload });
    const event = { preventDefault: vi.fn() };

    handlers.get('vite:preloadError')(event);

    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(reload).toHaveBeenCalledTimes(1);

    stop();
    expect(handlers.has('vite:preloadError')).toBe(false);
  });
});
