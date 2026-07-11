import { describe, expect, it } from 'vitest';
import { getApiErrorMessage } from './apiErrorMessage';

describe('getApiErrorMessage', () => {
  it('reads an API envelope message', () => {
    const error = {
      response: { data: { success: false, message: 'Alias taken' } }
    };
    expect(getApiErrorMessage(error)).toBe('Alias taken');
  });

  it('does not expose HTML error pages to users', () => {
    const error = {
      response: {
        headers: { 'content-type': 'text/html; charset=utf-8' },
        data: '<h1>Proxy failure</h1>'
      }
    };
    expect(getApiErrorMessage(error, 'Please try again')).toBe(
      'Please try again'
    );
  });
});
