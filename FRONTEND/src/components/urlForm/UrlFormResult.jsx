import { Check, Copy, Share2 } from 'lucide-react';

const UrlFormResult = ({
  shortUrl,
  isLanding,
  user,
  onShowAuth,
  isCopied,
  onCopy,
  onShare,
  ref
}) => {
  return (
    <output
      ref={ref}
      className={
        isLanding
          ? 'short-link-result short-link-result--landing animate-fade-in'
          : 'short-link-result short-link-result--panel app-panel animate-fade-in'
      }
      aria-live="polite"
      aria-label="Short link created"
    >
      <div className="short-link-result__header">
        <span className="short-link-result__status">
          <Check className="size-3.5" strokeWidth={2.5} aria-hidden="true" />
          Short link ready
        </span>
        <button
          type="button"
          onClick={onShare}
          className="short-link-result__ghost-action"
          aria-label="Share shortened URL"
        >
          <Share2 className="size-4" aria-hidden="true" />
          Share
        </button>
      </div>

      <label htmlFor="short-url-output" className="sr-only">
        Your shortened URL
      </label>
      <div className="short-link-result__control">
        <input
          id="short-url-output"
          type="text"
          value={shortUrl}
          readOnly
          className="short-link-result__input"
          onClick={(e) => e.target.select()}
        />
        <button
          type="button"
          onClick={onCopy}
          aria-label={
            isCopied ? 'URL copied to clipboard' : 'Copy URL to clipboard'
          }
          className="short-link-result__copy"
        >
          {isCopied ? (
            <>
              <Check className="size-4" aria-hidden="true" />
              Copied
            </>
          ) : (
            <>
              <Copy className="size-4" aria-hidden="true" />
              Copy
            </>
          )}
        </button>
      </div>

      {!user && (
        <div className="short-link-result__footer">
          <p className="text-sm text-muted-strong">
            <strong className="text-ink">Not saved to your account.</strong>{' '}
            <button
              type="button"
              onClick={onShowAuth}
              className="landing-text-link font-medium"
            >
              Sign up free
            </button>{' '}
            to track clicks and manage your links.
          </p>
        </div>
      )}
    </output>
  );
};

export default UrlFormResult;
