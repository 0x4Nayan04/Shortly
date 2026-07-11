import { describe, expect, it, vi } from 'vitest';
import { isAdminUser } from './isAdmin';

describe('isAdminUser', () => {
  it('returns false when admin emails are not configured', () => {
    vi.stubEnv('VITE_ADMIN_EMAILS', '');
    expect(isAdminUser('admin@example.com')).toBe(false);
  });

  it('matches configured admin emails case-insensitively', () => {
    vi.stubEnv('VITE_ADMIN_EMAILS', 'Admin@Example.com,ops@example.com');
    expect(isAdminUser('admin@example.com')).toBe(true);
    expect(isAdminUser('user@example.com')).toBe(false);
  });
});
