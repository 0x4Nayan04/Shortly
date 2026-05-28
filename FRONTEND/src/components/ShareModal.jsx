import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Check, Copy, Loader2, QrCode, Share2, X } from 'lucide-react';
import QRCode from 'qrcode';
import { buildPublicShortUrl } from '../utils/publicShortUrl';
import { showToast, useCopyToClipboard } from './UxEnhancements';
import { WhatsAppBrandIcon, XBrandIcon } from './ShareBrandIcons';

const ShareModal = memo(({ isOpen, onClose, shortUrl, fullUrl }) => {
  const dialogRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const { copy, isCopied } = useCopyToClipboard();
  const shortUrlFull = buildPublicShortUrl(shortUrl);
  const copied = isCopied(shortUrlFull);

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.focus();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) onCloseRef.current?.();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleCopy = useCallback(() => {
    copy(shortUrlFull, 'Link copied to clipboard!');
  }, [copy, shortUrlFull]);

  const handleWebShare = useCallback(async () => {
    if (!navigator?.share) {
      showToast.error('Web Share not supported on this browser');
      return;
    }
    try {
      await navigator.share({
        title: 'Shortly',
        text: 'Check out this link',
        url: shortUrlFull
      });
    } catch (err) {
      if (err.name !== 'AbortError') {
        showToast.error('Share cancelled');
      }
    }
  }, [shortUrlFull]);

  const downloadQr = useCallback(async () => {
    setDownloading(true);
    try {
      const dataUrl = await QRCode.toDataURL(shortUrlFull, {
        type: 'image/png',
        margin: 2,
        width: 400,
        color: { dark: '#0b1015', light: '#ffffff' }
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `qr-${shortUrl}.png`;
      a.click();
      showToast.success('QR code downloaded!');
    } catch {
      showToast.error('Failed to download QR code');
    } finally {
      setDownloading(false);
    }
  }, [shortUrl, shortUrlFull]);

  if (!isOpen) return null;

  const shareActions = [
    {
      label: 'Web Share',
      icon: (
        <Share2
          className='h-5 w-5'
          aria-hidden='true'
        />
      ),
      onClick: handleWebShare,
      hidden: !navigator?.share
    },
    {
      label: 'X',
      icon: <XBrandIcon className='h-5 w-5' />,
      circleClass:
        'text-ink hover:bg-[var(--color-surface-muted)] hover:border-border',
      onClick: () =>
        window.open(
          `https://x.com/intent/tweet?text=${encodeURIComponent(shortUrlFull)}`,
          '_blank',
          'noopener'
        )
    },
    {
      label: 'WhatsApp',
      icon: <WhatsAppBrandIcon className='h-5 w-5' />,
      circleClass:
        'text-[#25D366] hover:bg-[var(--color-surface-muted)] hover:border-border',
      onClick: () =>
        window.open(
          `https://wa.me/?text=${encodeURIComponent(shortUrlFull)}`,
          '_blank',
          'noopener'
        )
    },
    {
      label: 'Download QR',
      icon: downloading ? (
        <Loader2
          className='h-5 w-5 animate-spin'
          aria-hidden='true'
        />
      ) : (
        <QrCode
          className='h-5 w-5'
          aria-hidden='true'
        />
      ),
      onClick: downloadQr
    }
  ];

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4'
      role='dialog'
      aria-modal='true'
      aria-labelledby='share-dialog-title'>
      <div
        className='absolute inset-0 bg-[color-mix(in_srgb,var(--color-ink)_45%,transparent)] backdrop-blur-sm'
        onClick={onClose}
        aria-hidden='true'
      />
      <div
        ref={dialogRef}
        tabIndex={-1}
        className='share-modal relative app-panel w-full max-w-[30rem] max-h-[90dvh] overflow-y-auto animate-scale-in'>
        <div className='share-modal__header'>
          <div className='share-modal__title-wrap'>
            <p className='share-modal__eyebrow'>Quick actions</p>
            <h2
              id='share-dialog-title'
              className='share-modal__title'>
              Share URL
            </h2>
          </div>
          <button
            type='button'
            onClick={onClose}
            className='landing-icon-btn share-modal__close'
            aria-label='Close'>
            <X
              className='h-5 w-5'
              aria-hidden='true'
            />
          </button>
        </div>

        <div className='share-modal__url-block'>
          <label
            className='share-modal__field-label'
            htmlFor='share-modal-short-url'>
            Short URL
          </label>
          <div className='share-modal__short-row'>
            <input
              id='share-modal-short-url'
              readOnly
              value={shortUrlFull}
              className='sm-input share-modal__short-input'
              onClick={(e) => e.target.select()}
              aria-label='Shortened URL'
            />
            <button
              type='button'
              onClick={handleCopy}
              className={`share-modal__copy-btn ${
                copied ? 'share-modal__copy-btn--copied' : ''
              }`}
              aria-label={copied ? 'Copied to clipboard' : 'Copy short URL'}
              title={copied ? 'Copied!' : 'Copy short URL'}
              aria-live='polite'>
              {copied ? (
                <Check
                  className='h-4 w-4'
                  aria-hidden='true'
                />
              ) : (
                <Copy
                  className='h-4 w-4'
                  aria-hidden='true'
                />
              )}
            </button>
          </div>
        </div>

        <div className='share-modal__original-row'>
          <span
            className='share-modal__original-label'
            aria-hidden='true'>
            Original
          </span>
          <p
            className='share-modal__original-url'
            title={fullUrl}>
            {fullUrl}
          </p>
        </div>

        <div className='share-modal__divider' aria-hidden='true' />

        <div className='share-modal__actions'>
          {shareActions
            .filter((a) => !a.hidden)
            .map((action) => (
              <button
                key={action.label}
                type='button'
                onClick={action.onClick}
                className='share-modal__action group'
                aria-label={action.label}>
                <div
                  className={`share-modal__action-icon ${
                    action.circleClass ??
                    'text-muted hover:border-primary hover:bg-[var(--color-blue-tint)] hover:text-primary'
                  }`}>
                  {action.icon}
                </div>
                <span className='share-modal__action-label'>
                  {action.label}
                </span>
              </button>
            ))}
        </div>
      </div>
    </div>
  );
});

ShareModal.displayName = 'ShareModal';

export default ShareModal;
