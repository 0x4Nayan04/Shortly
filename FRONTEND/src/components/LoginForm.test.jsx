import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginForm from '../components/LoginForm';
import { renderWithProviders } from '../test/renderWithProviders';

vi.mock('../api/user.api', () => ({
  loginUser: vi.fn(),
  resendVerificationEmail: vi.fn()
}));

vi.mock('../utils/showToast', () => ({
  showToast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn()
  }
}));

import { loginUser } from '../api/user.api';
import { showToast } from '../utils/showToast';

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows validation feedback when required fields are empty', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    await user.click(
      within(screen.getByRole('form')).getByRole('button', { name: /sign in/i })
    );

    expect(showToast.error).toHaveBeenCalledWith(
      'Please fill in all required fields.'
    );
    expect(loginUser).not.toHaveBeenCalled();
  });

  it('calls onLoginSuccess after a successful sign-in', async () => {
    const onLoginSuccess = vi.fn();
    loginUser.mockResolvedValue({
      success: true,
      user: { _id: '1', email: 'user@example.com', name: 'Test User' }
    });

    const user = userEvent.setup();
    renderWithProviders(<LoginForm onLoginSuccess={onLoginSuccess} />);

    await user.type(screen.getByLabelText(/email address/i), 'user@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'any-password');
    await user.click(
      within(screen.getByRole('form')).getByRole('button', { name: /sign in/i })
    );

    await waitFor(() => {
      expect(loginUser).toHaveBeenCalledWith('user@example.com', 'any-password');
      expect(onLoginSuccess).toHaveBeenCalled();
    });
  });
});
