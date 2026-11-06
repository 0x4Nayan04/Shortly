import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UrlForm from '../components/UrlForm';
import { renderWithProviders } from '../test/renderWithProviders';

vi.mock('../api/shortUrl.api', () => ({
  createShortUrl: vi.fn(),
  createCustomShortUrl: vi.fn(),
  emailAnonymousClaimRecovery: vi.fn()
}));

vi.mock('../utils/showToast', () => ({
  showToast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(() => 'loading-toast'),
    dismiss: vi.fn()
  }
}));

vi.mock('../utils/anonymousLinks', () => ({
  rememberAnonymousLink: vi.fn()
}));

import {
  createShortUrl,
  emailAnonymousClaimRecovery
} from '../api/shortUrl.api';
import { showToast } from '../utils/showToast';

describe('UrlForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a short URL for anonymous users', async () => {
    createShortUrl.mockResolvedValue({
      success: true,
      data: {
        short_url: 'abc123',
        id: '64f1c2ab3f1c2ab3f1c2ab3f',
        manage_token: 'a'.repeat(48)
      }
    });

    const user = userEvent.setup();
    renderWithProviders(<UrlForm />);

    await user.type(
      screen.getByLabelText(/enter your long url/i),
      'https://example.com/article'
    );
    await user.click(screen.getByRole('button', { name: /^shorten$/i }));

    await waitFor(() => {
      expect(createShortUrl).toHaveBeenCalledWith('https://example.com/article');
      expect(screen.getByDisplayValue(/abc123/i)).toBeInTheDocument();
    });
  });

  it('removes the previous result and success toast when the next submission fails', async () => {
    showToast.success.mockReturnValue('success-toast');
    createShortUrl.mockResolvedValueOnce({ success: true, data: { short_url: 'abc123' } });
    createShortUrl.mockRejectedValueOnce({ response: { data: { message: 'Could not create link' } } });
    const user = userEvent.setup();
    renderWithProviders(<UrlForm />);
    const input = screen.getByLabelText(/enter your long url/i);
    await user.type(input, 'https://example.com/first');
    await user.click(screen.getByRole('button', { name: /^shorten$/i }));
    expect(await screen.findByDisplayValue(/abc123/i)).toBeInTheDocument();
    await user.type(input, 'https://example.com/second');
    await user.click(screen.getByRole('button', { name: /^shorten$/i }));
    await waitFor(() => expect(screen.getByText('Could not create link')).toBeInTheDocument());
    expect(screen.queryByDisplayValue(/abc123/i)).not.toBeInTheDocument();
    expect(showToast.dismiss).toHaveBeenCalledWith('success-toast');
  });

  it('emails an anonymous claim link after creation', async () => {
    createShortUrl.mockResolvedValue({
      success: true,
      data: {
        short_url: 'recover1',
        id: '64f1c2ab3f1c2ab3f1c2ab3f',
        manage_token: 'a'.repeat(48)
      }
    });
    emailAnonymousClaimRecovery.mockResolvedValue({ success: true });

    const user = userEvent.setup();
    renderWithProviders(<UrlForm />);
    await user.type(
      screen.getByLabelText(/enter your long url/i),
      'https://example.com/recover'
    );
    await user.click(screen.getByRole('button', { name: /shorten/i }));
    await user.type(
      await screen.findByLabelText(/email for link recovery/i),
      'owner@example.com'
    );
    await user.click(screen.getByRole('button', { name: /email claim link/i }));

    await waitFor(() => {
      expect(emailAnonymousClaimRecovery).toHaveBeenCalledWith({
        id: '64f1c2ab3f1c2ab3f1c2ab3f',
        manageToken: 'a'.repeat(48),
        email: 'owner@example.com'
      });
      expect(screen.getByText(/recovery email sent/i)).toBeInTheDocument();
    });
  });
});
