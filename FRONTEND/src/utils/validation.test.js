import { describe, expect, it } from 'vitest';
import { hasErrors, validateForm, validators } from './validation';

describe('validators', () => {
  it('accepts valid public URLs and rejects unsupported schemes', () => {
    expect(validators.url('https://example.com/path?q=1')).toBeNull();
    expect(validators.url('javascript:alert(1)')).toMatch(/http/);
    expect(validators.url('ftp://example.com')).toMatch(/http/);
  });

  it('enforces the backend alias contract', () => {
    expect(validators.customAlias('my-link', { required: true })).toBeNull();
    expect(validators.customAlias('ab', { required: true })).toMatch(/3/);
    expect(validators.customAlias('has spaces', { required: true })).toMatch(
      /letters, numbers/
    );
  });

  it('reports errors from a form rule map', () => {
    const errors = validateForm(
      { email: 'invalid', password: '' },
      { email: validators.email, password: validators.loginPassword }
    );

    expect(hasErrors(errors)).toBe(true);
    expect(errors.email).toMatch(/valid email/);
    expect(errors.password).toBe('Password is required');
  });
});
