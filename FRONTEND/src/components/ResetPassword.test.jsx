import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { OnlineStatusProvider } from './ux/onlineStatus';
import ResetPassword from './ResetPassword';
import { resetPassword } from '../api/user.api';

vi.mock('../api/user.api', () => ({ resetPassword: vi.fn().mockResolvedValue({}) }));

function renderReset(path) {
  const router = createMemoryRouter([
    { path: '/reset-password/:token?', element: <OnlineStatusProvider><ResetPassword /></OnlineStatusProvider> }
  ], { initialEntries: [path] });
  render(<RouterProvider router={router} />);
}

describe('reset password links', () => {
  it('explains how to recover when the token is missing', () => {
    renderReset('/reset-password');
    expect(screen.getByText('Reset link missing')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /request a new reset link/i })).toHaveAttribute('href', '/forgot-password');
  });

  it.each(['/reset-password/path-token', '/reset-password?token=query-token'])(
    'submits the token from %s', async (path) => {
      const user = userEvent.setup();
      renderReset(path);
      await user.type(screen.getByLabelText('New password'), 'SecurePassword123!');
      await user.type(screen.getByLabelText('Confirm password'), 'SecurePassword123!');
      await user.click(screen.getByRole('button', { name: 'Reset password' }));
      expect(await screen.findByText('Password reset')).toBeInTheDocument();
      expect(resetPassword).toHaveBeenLastCalledWith(path.includes('?') ? 'query-token' : 'path-token', 'SecurePassword123!');
    }
  );
});
