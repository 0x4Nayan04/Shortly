import { memo } from 'react';
import { Check, Copy, Loader2, Share2, Trash2 } from 'lucide-react';
import {
  buildPublicShortUrl,
  getShortLinkDisplayParts
} from '../utils/publicShortUrl';

const DashboardLinkRow = memo(
  ({
    url,
    onCopy,
    onDelete,
    isCopied,
    isDeleting,
    isSelected,
    onSelect,
    onShare
  }) => {
    const shortUrlFull = buildPublicShortUrl(url.short_url);
    const { hostLead, hostTrail, slug } = getShortLinkDisplayParts(url.short_url);
    const createdLabel = new Date(url.createdAt).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    const clickLabel = `${url.click} click${url.click !== 1 ? 's' : ''}`;

    return (
      <li
        className={`dashboard-link-item${isSelected ? ' dashboard-link-item--selected' : ''}`}>
        <div className='dashboard-link-item__main'>
          <input
            type='checkbox'
            checked={isSelected}
            onChange={(e) => onSelect(url._id, e.target.checked)}
            className='dashboard-links-toolbar__checkbox dashboard-link-item__check'
            aria-label={`Select ${url.short_url}`}
          />

          <div className='dashboard-link-item__body'>
            <a
              href={shortUrlFull}
              target='_blank'
              rel='noopener noreferrer'
              className='dashboard-link-item__short'
              title={shortUrlFull}
              aria-label={`Open ${shortUrlFull} in a new tab`}>
              {hostLead ? (
                <>
                  <span className='dashboard-link-item__host'>
                    {hostLead}
                    {hostTrail ? <span>{hostTrail}</span> : null}
                    <span className='dashboard-link-item__slash'>/</span>
                  </span>
                  <span className='dashboard-link-item__slug'>{slug}</span>
                </>
              ) : (
                <span className='dashboard-link-item__slug'>/{slug}</span>
              )}
            </a>
            <p
              className='dashboard-link-item__dest'
              title={url.full_url}>
              {url.full_url}
            </p>
          </div>

          <p className='dashboard-link-item__meta catalog-row-meta'>
            <span className='tabular-nums'>{clickLabel}</span>
            <span
              className='dashboard-link-item__meta-sep'
              aria-hidden='true'>
              ·
            </span>
            <time
              className='tabular-nums'
              dateTime={url.createdAt}>
              {createdLabel}
            </time>
          </p>

          <div className='dashboard-link-item__actions'>
            <button
              type='button'
              onClick={() => onCopy(shortUrlFull)}
              className={`dashboard-link-item__action${isCopied ? ' dashboard-link-item__action--done' : ''}`}
              aria-live='polite'
              aria-label={
                isCopied
                  ? 'Copied to clipboard'
                  : `Copy ${shortUrlFull} to clipboard`
              }>
              {isCopied ? (
                <Check
                  className='h-[1.125rem] w-[1.125rem]'
                  aria-hidden='true'
                />
              ) : (
                <Copy
                  className='h-[1.125rem] w-[1.125rem]'
                  aria-hidden='true'
                />
              )}
            </button>
            <button
              type='button'
              onClick={() =>
                onShare({ short_url: url.short_url, full_url: url.full_url })
              }
              className='dashboard-link-item__action'
              aria-label={`Share ${url.short_url}`}>
              <Share2
                className='h-[1.125rem] w-[1.125rem]'
                aria-hidden='true'
              />
            </button>
            <button
              type='button'
              onClick={() => onDelete(url._id, url.short_url)}
              disabled={isDeleting}
              className='dashboard-link-item__action dashboard-link-item__action--danger'
              aria-busy={isDeleting}
              aria-label={
                isDeleting ? 'Deleting link' : `Delete ${url.short_url}`
              }>
              {isDeleting ? (
                <Loader2
                  className='h-[1.125rem] w-[1.125rem] animate-spin'
                  aria-hidden='true'
                />
              ) : (
                <Trash2
                  className='h-[1.125rem] w-[1.125rem]'
                  aria-hidden='true'
                />
              )}
            </button>
          </div>
        </div>
      </li>
    );
  }
);

DashboardLinkRow.displayName = 'DashboardLinkRow';

export default DashboardLinkRow;
