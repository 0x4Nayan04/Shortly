import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import RegisterForm from '../components/RegisterForm';
import LoginForm from '../components/LoginForm';
import { renderWithProviders } from './renderWithProviders';

describe('auth accessibility', () => {
  it('register form has no detectable axe violations', async () => {
    const { container } = renderWithProviders(<RegisterForm />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('login form has no detectable axe violations', async () => {
    const { container } = renderWithProviders(<LoginForm />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
