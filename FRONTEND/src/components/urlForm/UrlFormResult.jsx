import { Check, Share2 } from 'lucide-react';

const UrlFormResult = ({
  shortUrl,
  isLanding,
  user,
  onShowAuth,
  isCopied,
  onCopy,
  onShare
}) => {
  return (
    <output
      className={
        isLanding
          ? 'short-link-result short-link-result--landing animate-fade-in'
          : 'short-link-result app-panel animate-fade-in'
      }
      aria-live="polite"
    >
      <div className="short-link-result__header">
        <div className="short-link-result__icon">
          <Check className="w-4 h-4" aria-hidden="true" />
        </div>
        <div className="short-link-result__heading">
          <p className="short-link-result__eyebrow">Short link created</p>
          <h3 className="short-link-result__title">
            {isLanding
              ? 'Your short link is ready'
              : 'URL shortened successfully!'}
          </h3>
        </div>
      </div>

      <div className="short-link-result__body">
        <label htmlFor="short-url-output" className="short-link-result__label">
          Your shortened URL
        </label>
        <div className="short-link-result__url-row">
          <input
            id="short-url-output"
            type="text"
            value={shortUrl}
            readOnly
            className="short-link-result__input sm-input"
            aria-describedby="short-url-description"
            onClick={(e) => e.target.select()}
          />
          <button
            type="button"
            onClick={onCopy}
            aria-label={
              isCopied ? 'URL copied to clipboard' : 'Copy URL to clipboard'
            }
            className="short-link-result__copy sm-btn sm-btn-primary"
          >
            {isCopied ? (
              <>
                <Check className="w-4 h-4" aria-hidden="true" />
                Copied
              </>
            ) : (
              'Copy'
            )}
          </button>
          <button
            type="button"
            onClick={onShare}
            className="short-link-result__share sm-btn sm-btn-secondary"
            aria-label="Share shortened URL"
          >
            <Share2 className="w-4 h-4" aria-hidden="true" />
            Share
          </button>
        </div>
        <p
          id="short-url-description"
          className="short-link-result__description"
        >
          Copy your new shortened URL or share it using the buttons above.
        </p>
      </div>

      {!user && (
        <div className="mt-4 border-t border-border pt-4">
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
