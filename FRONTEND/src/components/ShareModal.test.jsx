import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import ShareModal from './ShareModal';
import QRCode from 'qrcode';

vi.mock('qrcode', () => ({ default: { toDataURL: vi.fn() } }));

beforeEach(() => {
  QRCode.toDataURL.mockReset();
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value: function () {
      this.open = true;
    }
  });
});

it('offers a retry when QR generation fails', async () => {
  QRCode.toDataURL
    .mockRejectedValueOnce(new Error('QR unavailable'))
    .mockResolvedValueOnce('data:image/png;base64,retry');
  render(<ShareModal isOpen onClose={vi.fn()} shortUrl="first" />);
  await userEvent.click(
    await screen.findByRole('button', { name: 'Retry QR code' })
  );
  expect(await screen.findByAltText('QR Code')).toHaveAttribute(
    'src',
    'data:image/png;base64,retry'
  );
});

it('ignores an older QR request after switching links', async () => {
  let resolveFirst;
  QRCode.toDataURL
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFirst = resolve;
        })
    )
    .mockResolvedValueOnce('data:image/png;base64,second');
  const { rerender } = render(
    <ShareModal isOpen onClose={vi.fn()} shortUrl="first" />
  );
  await waitFor(() => expect(QRCode.toDataURL).toHaveBeenCalledTimes(1));
  rerender(<ShareModal isOpen onClose={vi.fn()} shortUrl="second" />);
  expect(await screen.findByAltText('QR Code')).toHaveAttribute(
    'src',
    'data:image/png;base64,second'
  );
  await act(async () => {
    resolveFirst('data:image/png;base64,first');
  });
  expect(screen.getByAltText('QR Code')).toHaveAttribute(
    'src',
    'data:image/png;base64,second'
  );
});
