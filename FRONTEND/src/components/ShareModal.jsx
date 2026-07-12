import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState
} from 'react';
import { createPortal } from 'react-dom';
import { Check, Copy, Loader2, QrCode, Share2, X } from 'lucide-react';
import { FaWhatsapp, FaXTwitter } from 'react-icons/fa6';
import QRCode from 'qrcode';
import { buildPublicShortUrl } from '../utils/publicShortUrl';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { useCopyToClipboard } from './UxEnhancements';
import { showToast } from '../utils/showToast';

const QR_OPTIONS = {
  type: 'image/png',
  margin: 1,
  width: 300,
  color: { dark: '#0b1015', light: '#ffffff' }
};

function loadQrDataUrl(shortUrlFull) {
  if (!shortUrlFull) return Promise.resolve('');
  return QRCode.toDataURL(shortUrlFull, QR_OPTIONS).catch((err) => {
    console.error(err);
    return '';
  });
}

const ShareModal = memo(({ isOpen, onClose, shortUrl, fullUrl }) => {
  const dialogRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const { copy, isCopied } = useCopyToClipboard();
  const shortUrlFull = shortUrl ? buildPublicShortUrl(shortUrl) : '';
  const copied = shortUrlFull ? isCopied(shortUrlFull) : false;

  const setDialogRef = useCallback(
    (node) => {
      dialogRef.current = node;
      if (!node) return;
      if (!node.open) node.showModal();
      node.focus();
      loadQrDataUrl(shortUrlFull).then(setQrDataUrl);
    },
    [shortUrlFull]
  );

  useBodyScrollLock(isOpen);

  const onCloseRef = useRef(onClose);

  useLayoutEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

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
    if (typeof navigator === 'undefined' || !navigator.share) {
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
        showToast.error('Could not share link');
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
      label: 'Share',
      icon: <Share2 className="size-5" aria-hidden="true" />,
      onClick: handleWebShare,
      hidden: typeof navigator === 'undefined' || !navigator.share
    },
    {
      label: 'Share on X',
      icon: <FaXTwitter className="size-[1.125rem]" aria-hidden="true" />,
      onClick: () =>
        window.open(
          `https://x.com/intent/tweet?text=${encodeURIComponent(shortUrlFull)}`,
          '_blank',
          'noopener'
        )
    },
    {
      label: 'WhatsApp',
      icon: <FaWhatsapp className="size-5" aria-hidden="true" />,
      primary: true,
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
        <Loader2 className="size-5 animate-spin" aria-hidden="true" />
      ) : (
        <QrCode className="size-5" aria-hidden="true" />
      ),
      onClick: downloadQr
    }
  ];
  const visibleShareActions = shareActions.filter((action) => !action.hidden);

  return createPortal(
    <dialog
      ref={setDialogRef}
      className="share-modal-dialog fixed inset-0 m-0 size-full max-h-none max-w-none overflow-hidden bg-transparent p-3 sm:p-4"
      aria-labelledby="share-dialog-title"
      onCancel={onClose}
    >
      <div className="flex size-full items-center justify-center">
        <div className="share-modal relative app-panel flex w-full max-w-[28rem] max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2rem)] flex-col overflow-hidden animate-scale-in p-5 sm:p-6">
          <div className="share-modal__header flex shrink-0 items-center justify-between pb-4 mb-5 border-b border-border">
            <div className="share-modal__title-wrap flex flex-col gap-1">
              <h2
                id="share-dialog-title"
                className="share-modal__title font-display text-xl font-semibold text-ink m-0 leading-none tracking-tight"
              >
                Share this link
              </h2>
              <p className="text-sm text-muted m-0">
                Scan the QR code or copy the link below.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="landing-icon-btn shrink-0 size-8 rounded-full border border-border bg-surface-muted text-muted-strong hover:text-ink hover:border-primary transition-colors flex items-center justify-center"
              aria-label="Close"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>

          <div className="flex min-h-0 flex-col gap-4 overflow-y-auto overscroll-contain pr-0.5">
            <div className="flex flex-col items-center justify-center bg-surface-muted border border-border p-3 rounded-sm">
              {qrDataUrl ? (
                <div className="bg-white p-2 rounded-sm shadow-sm border border-border/50">
                  <img
                    src={qrDataUrl}
                    alt="QR Code"
                    className="size-32 sm:size-36 object-contain"
                  />
                </div>
              ) : (
                <div className="size-32 sm:size-36 flex items-center justify-center text-muted">
                  <Loader2 className="size-6 animate-spin" />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label
                  className="text-sm font-medium text-ink"
                  htmlFor="share-modal-short-url"
                >
                  Short URL
                </label>
                <div className="share-modal__short-control shadow-sm">
                  <input
                    id="share-modal-short-url"
                    readOnly
                    value={shortUrlFull}
                    placeholder="Short URL unavailable"
                    className="share-modal__short-control-input sm-input font-mono text-sm bg-surface"
                    onClick={(e) => e.target.select()}
                    aria-label="Shortened URL"
                  />
                  <button
                    type="button"
                    onClick={handleCopy}
                    disabled={!shortUrlFull}
                    className={`share-modal__short-control-copy ${
                      copied
                        ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                        : 'bg-surface-muted text-ink hover:bg-background-alt hover:border-primary'
                    }`}
                    aria-label={
                      copied ? 'Copied to clipboard' : 'Copy short URL'
                    }
                    title={copied ? 'Copied!' : 'Copy short URL'}
                    aria-live="polite"
                  >
                    {copied ? (
                      <>
                        <Check className="size-4 mr-1.5" aria-hidden="true" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="size-4 mr-1.5" aria-hidden="true" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>

              {fullUrl && (
                <div className="flex min-w-0 flex-col gap-1.5 p-3 bg-blue-tint/30 border border-border/60 rounded-sm">
                  <span
                    className="text-xs font-semibold uppercase tracking-wider text-primary"
                    aria-hidden="true"
                  >
                    Destination
                  </span>
                  <p
                    className="min-w-0 truncate text-sm text-muted-strong m-0 leading-relaxed"
                    title={fullUrl}
                  >
                    {fullUrl}
                  </p>
                </div>
              )}
            </div>

            <div className="share-modal__actions-grid pt-4 border-t border-border">
              {visibleShareActions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={action.onClick}
                  disabled={!shortUrlFull}
                  className={`share-modal__action-button ${
                    action.primary ? 'share-modal__action-button--primary' : ''
                  }`}
                  aria-label={action.label}
                >
                  {action.icon}
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </dialog>,
    document.body
  );
});

ShareModal.displayName = 'ShareModal';

export default ShareModal;
