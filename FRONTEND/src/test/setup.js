import '@testing-library/jest-dom/vitest';
import * as matchers from 'vitest-axe/matchers';
import { afterEach, expect, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

expect.extend(matchers);

afterEach(() => {
  cleanup();
});



const storage =
  globalThis.window?.localStorage ?? globalThis.localStorage ?? null;
if (!storage || typeof storage.clear !== 'function') {
  const data = new Map();
  const stub = {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => {
      data.set(String(key), String(value));
    },
    removeItem: (key) => {
      data.delete(String(key));
    },
    clear: () => {
      data.clear();
    },
    key: (index) => [...data.keys()][index] ?? null,
    get length() {
      return data.size;
    }
  };
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    writable: true,
    value: stub
  });
  if (globalThis.window) {
    Object.defineProperty(globalThis.window, 'localStorage', {
      configurable: true,
      writable: true,
      value: stub
    });
  }
}

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
});

Element.prototype.scrollIntoView = vi.fn();
