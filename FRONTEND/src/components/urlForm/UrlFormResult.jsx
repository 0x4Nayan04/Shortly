import { useState } from 'react';
import { Check, Copy, Mail, Share2 } from 'lucide-react';
import { emailAnonymousClaimRecovery } from '../../api/shortUrl.api';
import { getApiErrorMessage } from '../../utils/axiosInstance';
import { showToast } from '../../utils/showToast';

const UrlFormResult = ({
  shortUrl,
  isLanding,
  user,
  onShowAuth,
  isCopied,
  onCopy,
  onShare,
  createdLink,
  ref
}) => {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleEmailRecovery = async (event) => {
    event.preventDefault();
    if (!email.trim() || !createdLink?.id || !createdLink?.manageToken) return;
    setSending(true);
    try {
      await emailAnonymousClaimRecovery({
        id: createdLink.id,
        manageToken: createdLink.manageToken,
        email: email.trim()
      });
      setSent(true);
      showToast.success('Recovery email sent');
    } catch (error) {
      showToast.error(getApiErrorMessage(error, 'Could not send recovery email.'));
    } finally {
      setSending(false);
    }
  };

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
          {createdLink?.manageToken && (
            <form onSubmit={handleEmailRecovery} className="mt-3 space-y-2">
              <p className="text-sm text-muted-strong">
                Save access for another device by emailing yourself a one-time
                claim link.
              </p>
              {sent ? (
                <p className="flex items-center gap-2 text-sm text-success" role="status">
                  <Check className="size-4" aria-hidden="true" />
                  Recovery email sent. The link expires in 24 hours.
                </p>
              ) : (
                <div className="short-link-result__recovery">
                  <label htmlFor="recovery-email" className="sr-only">
                    Email for link recovery
                  </label>
                  <input
                    id="recovery-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="sm-input short-link-result__recovery-input"
                  />
                  <button
                    type="submit"
                    disabled={sending}
                    className="sm-btn sm-btn-secondary short-link-result__recovery-submit"
                  >
                    <Mail className="size-4" aria-hidden="true" />
                    {sending ? 'Sending…' : 'Email claim link'}
                  </button>
                </div>
              )}
            </form>
          )}
        </div>
      )}
    </output>
  );
};

export default UrlFormResult;
