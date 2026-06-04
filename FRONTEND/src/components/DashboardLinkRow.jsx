import { memo } from 'react';
import {
  Check,
  Copy,
  Loader2,
  Pencil,
  Power,
  PowerOff,
  Share2,
  Trash2
} from 'lucide-react';
import { useMediaQuery } from '../hooks/useMediaQuery';
import {
  buildPublicShortUrl,
  getShortLinkDisplayParts
} from '../utils/publicShortUrl';

const ActionButton = ({
  onClick,
  disabled,
  className = 'dashboard-link-item__action',
  ariaLabel,
  title,
  ariaBusy,
  children
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={ariaLabel}
    title={title}
    aria-busy={ariaBusy}
    className={className}
  >
    {children}
  </button>
);

const CopyButton = ({ isCopied, shortUrlFull, onCopy }) => (
  <ActionButton
    onClick={() => onCopy(shortUrlFull)}
    className={`dashboard-link-item__action${isCopied ? ' dashboard-link-item__action--done' : ''}`}
    aria-label={
      isCopied ? 'Copied to clipboard' : `Copy ${shortUrlFull} to clipboard`
    }
  >
    {isCopied ? (
      <Check className="size-[1.125rem]" aria-hidden="true" />
    ) : (
      <Copy className="size-[1.125rem]" aria-hidden="true" />
    )}
  </ActionButton>
);

const ShareButton = ({ disabled, shortUrl, onShare, fullUrl }) => (
  <ActionButton
    onClick={() => onShare({ short_url: shortUrl, full_url: fullUrl })}
    disabled={disabled}
    aria-label={`Share ${shortUrl}`}
  >
    <Share2 className="size-[1.125rem]" aria-hidden="true" />
  </ActionButton>
);

const EditButton = ({ disabled, shortUrl, isUpdating, onEdit }) => (
  <ActionButton
    onClick={onEdit}
    disabled={disabled}
    aria-label={`Edit ${shortUrl}`}
    title="Edit destination or alias"
  >
    {isUpdating ? (
      <Loader2 className="size-[1.125rem] animate-spin" aria-hidden="true" />
    ) : (
      <Pencil className="size-[1.125rem]" aria-hidden="true" />
    )}
  </ActionButton>
);

const ToggleButton = ({ disabled, shortUrl, isDisabled, onToggleDisabled }) => (
  <ActionButton
    onClick={onToggleDisabled}
    disabled={disabled}
    aria-label={isDisabled ? `Enable ${shortUrl}` : `Disable ${shortUrl}`}
    title={isDisabled ? 'Enable link' : 'Disable link'}
  >
    {isDisabled ? (
      <Power className="size-[1.125rem]" aria-hidden="true" />
    ) : (
      <PowerOff className="size-[1.125rem]" aria-hidden="true" />
    )}
  </ActionButton>
);

const DeleteButton = ({ disabled, shortUrl, isDeleting, onDelete }) => (
  <ActionButton
    onClick={onDelete}
    disabled={disabled}
    className="dashboard-link-item__action dashboard-link-item__action--danger"
    aria-busy={isDeleting}
    aria-label={isDeleting ? 'Deleting link' : `Delete ${shortUrl}`}
  >
    {isDeleting ? (
      <Loader2 className="size-[1.125rem] animate-spin" aria-hidden="true" />
    ) : (
      <Trash2 className="size-[1.125rem]" aria-hidden="true" />
    )}
  </ActionButton>
);

const ShortLinkDisplay = ({ hostLead, hostTrail, slug }) => {
  if (!hostLead) {
    return <span className="dashboard-link-item__slug">/{slug}</span>;
  }
  return (
    <>
      <span className="dashboard-link-item__host dashboard-link-item__host--truncate">
        {hostLead}
        {hostTrail ? <span>{hostTrail}</span> : null}
      </span>
      <span className="dashboard-link-item__slug">/{slug}</span>
    </>
  );
};

const LinkMeta = ({ clicks, clickText, createdLabel, createdAt }) => (
  <p className="dashboard-link-item__meta catalog-row-meta">
    <span className="dashboard-link-item__clicks">
      <span className="font-semibold">{clicks}</span>
      <span className="text-muted text-xs"> {clickText}</span>
    </span>
    <span className="dashboard-link-item__meta-sep" aria-hidden="true">
      ·
    </span>
    <time className="tabular-nums" dateTime={createdAt}>
      {createdLabel}
    </time>
  </p>
);

const DashboardLinkRow = memo(
  ({
    url,
    onCopy,
    onDelete,
    isCopied,
    isDeleting,
    isUpdating,
    isSelected,
    onSelect,
    onShare,
    onEdit,
    onToggleDisabled
  }) => {
    const showMeta = !useMediaQuery('(max-width: 767px)');
    const shortUrlFull = buildPublicShortUrl(url.short_url);
    const { hostLead, hostTrail, slug } = getShortLinkDisplayParts(
      url.short_url
    );
    const createdLabel = showMeta
      ? new Date(url.createdAt).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        })
      : '';
    const clickText = `click${url.click !== 1 ? 's' : ''}`;

    return (
      <li
        className={`dashboard-link-item${isSelected ? ' dashboard-link-item--selected' : ''}${url.disabled ? ' dashboard-link-item--disabled' : ''}`}
      >
        <div className="dashboard-link-item__main">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(url._id, e.target.checked)}
            className="dashboard-links-toolbar__checkbox dashboard-link-item__check"
            aria-label={`Select ${url.short_url}`}
          />

          <div className="dashboard-link-item__body">
            <a
              href={shortUrlFull}
              target="_blank"
              rel="noopener noreferrer"
              className="dashboard-link-item__short"
              title={shortUrlFull}
              aria-label={`Open ${shortUrlFull} in a new tab`}
            >
              <span className="dashboard-link-item__short-inner">
                <ShortLinkDisplay
                  hostLead={hostLead}
                  hostTrail={hostTrail}
                  slug={slug}
                />
              </span>
            </a>
            <p className="dashboard-link-item__dest" title={url.full_url}>
              {url.full_url}
            </p>
            {url.disabled && (
              <span className="dashboard-link-item__status">Disabled</span>
            )}
          </div>

          {showMeta && (
            <LinkMeta
              clicks={url.click}
              clickText={clickText}
              createdLabel={createdLabel}
              createdAt={url.createdAt}
            />
          )}

          <div className="dashboard-link-item__actions">
            <CopyButton
              isCopied={isCopied}
              shortUrlFull={shortUrlFull}
              onCopy={onCopy}
            />
            <ShareButton
              disabled={isUpdating}
              shortUrl={url.short_url}
              fullUrl={url.full_url}
              onShare={onShare}
            />
            <EditButton
              disabled={isUpdating || isDeleting}
              shortUrl={url.short_url}
              isUpdating={isUpdating}
              onEdit={() => onEdit(url)}
            />
            <ToggleButton
              disabled={isUpdating || isDeleting}
              shortUrl={url.short_url}
              isDisabled={url.disabled}
              onToggleDisabled={() => onToggleDisabled(url)}
            />
            <DeleteButton
              disabled={isDeleting || isUpdating}
              shortUrl={url.short_url}
              isDeleting={isDeleting}
              onDelete={() => onDelete(url._id, url.short_url)}
            />
          </div>
        </div>
      </li>
    );
  }
);

DashboardLinkRow.displayName = 'DashboardLinkRow';

export default DashboardLinkRow;
