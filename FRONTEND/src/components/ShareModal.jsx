import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Copy, Share2, QrCode, X } from 'lucide-react';
import { FaXTwitter, FaWhatsapp } from 'react-icons/fa6';
import QRCode from 'qrcode';
import { showToast } from './UxEnhancements';

const ShareModal = memo(({ isOpen, onClose, shortUrl, fullUrl }) => {
  const dialogRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const shortUrlFull = `${import.meta.env.VITE_APP_URL}/${shortUrl}`;

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

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) onClose?.();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const copyLink = useCallback(async () => {
    if (!navigator?.clipboard) {
      showToast.error('Clipboard not supported');
      return;
    }
    try {
      await navigator.clipboard.writeText(shortUrlFull);
      showToast.success('Link copied to clipboard!');
    } catch {
      showToast.error('Failed to copy');
    }
  }, [shortUrlFull]);

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
        color: { dark: '#000000', light: '#ffffff' }
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
      label: 'Copy Link',
      icon: (
        <Copy
          className='w-5 h-5'
          aria-hidden='true'
        />
      ),
      onClick: copyLink
    },
    {
      label: 'Web Share',
      icon: (
        <Share2
          className='w-5 h-5'
          aria-hidden='true'
        />
      ),
      onClick: handleWebShare,
      hidden: !navigator?.share
    },
    {
      label: 'Twitter',
      icon: (
        <FaXTwitter
          className='w-5 h-5'
          aria-hidden='true'
        />
      ),
      onClick: () =>
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(shortUrlFull)}`,
          '_blank',
          'noopener'
        )
    },
    {
      label: 'WhatsApp',
      icon: (
        <FaWhatsapp
          className='w-5 h-5'
          aria-hidden='true'
        />
      ),
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
        <div
          className='w-5 h-5 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600'
          aria-hidden='true'
        />
      ) : (
        <QrCode
          className='w-5 h-5'
          aria-hidden='true'
        />
      ),
      onClick: downloadQr
    }
  ];

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center p-4'
      role='dialog'
      aria-modal='true'
      aria-labelledby='share-dialog-title'>
      <div
        className='absolute inset-0 bg-black/50 backdrop-blur-sm'
        onClick={onClose}
        aria-hidden='true'
      />
      <div
        ref={dialogRef}
        tabIndex={-1}
        className='relative bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-scale-in'>
        <div className='flex items-center justify-between mb-6'>
          <h2
            id='share-dialog-title'
            className='text-lg font-semibold text-gray-900'>
            Share URL
          </h2>
          <button
            onClick={onClose}
            className='p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300'
            aria-label='Close'>
            <X
              className='w-5 h-5'
              aria-hidden='true'
            />
          </button>
        </div>

        {/* Short URL Box */}
        <div className='flex items-center gap-2 bg-gray-50 border border-gray-200 p-1.5 rounded-xl mb-3'>
          <input
            readOnly
            value={shortUrlFull}
            className='flex-1 bg-transparent text-sm text-gray-800 font-medium px-2 outline-none w-full'
            onClick={(e) => e.target.select()}
            aria-label='Shortened URL'
          />
          <button
            onClick={copyLink}
            className='flex-shrink-0 bg-white border border-gray-200 p-2 rounded-lg text-gray-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm'
            aria-label='Copy short URL'
            title='Copy short URL'>
            <Copy className='w-4 h-4' />
          </button>
        </div>

        {/* Original URL */}
        <div className='flex items-center px-2 mb-4'>
          <div className='w-1 h-1 rounded-full bg-gray-400 mr-2 flex-shrink-0'></div>
          <p
            className='text-xs text-gray-500 truncate'
            title={fullUrl}>
            {fullUrl}
          </p>
        </div>

        <div className='h-px bg-gray-100 w-full mb-4'></div>

        {/* Actions Grid */}
        <div className='flex flex-row items-start justify-center gap-4 sm:gap-6'>
          {shareActions
            .filter((a) => !a.hidden && a.label !== 'Copy Link')
            .map((action) => (
              <button
                key={action.label}
                onClick={action.onClick}
                className='group flex flex-col items-center gap-2 flex-1 max-w-[5rem] focus:outline-none'
                aria-label={action.label}>
                <div className='flex shrink-0 items-center justify-center w-12 h-12 bg-gray-50 border border-gray-100 hover:bg-indigo-50 hover:border-indigo-100 hover:text-indigo-600 text-gray-500 rounded-full transition-all group-focus-visible:ring-2 group-focus-visible:ring-indigo-500 shadow-sm'>
                  {action.icon}
                </div>
                <span className='text-[9px] sm:text-[10px] font-medium text-gray-500 group-hover:text-gray-900 transition-colors text-center w-full leading-tight'>
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
