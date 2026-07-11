import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RegisterForm from '../components/RegisterForm';
import { renderWithProviders } from '../test/renderWithProviders';

vi.mock('../api/user.api', () => ({
  registerUser: vi.fn(),
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

import { registerUser } from '../api/user.api';

const validPassword = 'correct horse battery staple';

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('submits registration when the form is valid', async () => {
    registerUser.mockResolvedValue({
      success: true,
      accepted: true,
      message: 'Account created'
    });

    const user = userEvent.setup();
    const switchToLogin = vi.fn();
    renderWithProviders(<RegisterForm switchToLogin={switchToLogin} />);

    await user.type(screen.getByLabelText(/full name/i), 'Test User');
    await user.type(screen.getByLabelText(/email address/i), 'user@example.com');
    await user.type(screen.getByLabelText(/^password$/i), validPassword);
    await user.type(screen.getByLabelText(/confirm password/i), validPassword);
    await user.click(
      within(screen.getByRole('form')).getByRole('button', {
        name: /create account/i
      })
    );

    await waitFor(() => {
      expect(registerUser).toHaveBeenCalledWith(
        'Test User',
        'user@example.com',
        validPassword
      );
    });
    expect(switchToLogin).toHaveBeenCalled();
  });
});
