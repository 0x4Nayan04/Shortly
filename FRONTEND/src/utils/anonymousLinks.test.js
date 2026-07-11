import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearAnonymousLinksByIds,
  readAnonymousLinks,
  rememberAnonymousLink
} from './anonymousLinks';

describe('anonymous link persistence', () => {
  beforeEach(() => localStorage.clear());

  it('deduplicates links and retains the newest 50 records', () => {
    for (let index = 0; index < 52; index += 1) {
      rememberAnonymousLink({
        id: `id-${index}`,
        manage_token: `token-${index}`,
        short_url: `slug-${index}`
      });
    }
    rememberAnonymousLink({
      id: 'id-51',
      manage_token: 'updated-token',
      short_url: 'updated-slug'
    });

    const links = readAnonymousLinks();
    expect(links).toHaveLength(50);
    expect(links.at(-1)).toMatchObject({
      id: 'id-51',
      manage_token: 'updated-token'
    });
  });

  it('removes only successfully processed records', () => {
    rememberAnonymousLink({ id: 'one', manage_token: 'a', short_url: 'one' });
    rememberAnonymousLink({ id: 'two', manage_token: 'b', short_url: 'two' });

    clearAnonymousLinksByIds(['one']);

    expect(readAnonymousLinks().map((link) => link.id)).toEqual(['two']);
  });

  it('fails safely when browser storage is unavailable', () => {
    const setItem = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new DOMException('Blocked', 'SecurityError');
      });

    expect(() =>
      rememberAnonymousLink({ id: 'one', manage_token: 'a', short_url: 'one' })
    ).not.toThrow();
    setItem.mockRestore();
  });
});
