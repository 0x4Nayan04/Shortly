import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UrlForm from '../components/UrlForm';
import { renderWithProviders } from '../test/renderWithProviders';

vi.mock('../api/shortUrl.api', () => ({
  createShortUrl: vi.fn(),
  createCustomShortUrl: vi.fn()
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

import { createShortUrl } from '../api/shortUrl.api';

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
    await user.click(screen.getByRole('button', { name: /shorten/i }));

    await waitFor(() => {
      expect(createShortUrl).toHaveBeenCalledWith('https://example.com/article');
      expect(screen.getByDisplayValue(/abc123/i)).toBeInTheDocument();
    });
  });
});
