import { describe, expect, it } from 'vitest';
import { getSafeReturnPath } from './routes';

describe('getSafeReturnPath', () => {
  it('keeps safe in-app destinations including search and hash state', () => {
    expect(getSafeReturnPath('/dashboard?page=2#links')).toBe(
      '/dashboard?page=2#links'
    );
  });

  it.each([
    'https://attacker.example',
    '//attacker.example/path',
    '/login',
    '/register',
    '%E0%A4%A'
  ])('rejects unsafe or recursive destination %s', (destination) => {
    expect(getSafeReturnPath(destination)).toBeNull();
  });
});
