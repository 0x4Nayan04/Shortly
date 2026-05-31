import { memo, useMemo } from 'react';
import { Link2, RefreshCw } from 'lucide-react';
import ClickAnalytics from '../ClickAnalytics';
import DashboardLinkRow from '../DashboardLinkRow';
import DashboardLinksToolbar from '../DashboardLinksToolbar';
import { UrlTableSkeletonRow } from '../LoadingSpinner';
import { EmptyState, ErrorRecovery } from '../UxEnhancements';
import { formCompoundClass } from '../../utils/designFormClasses';
import { buildPublicShortUrl } from '../../utils/publicShortUrl';
import Pagination from './Pagination';

const DashboardLinksPanel = ({
  linksPanelRef,
  linkTab,
  onLinkTabChange,
  showClickAnalytics,
  loading,
  totalCount,
  isAllSelected,
  isBulkDeleting,
  onSelectAll,
  onDeselectAll,
  onRefresh,
  search,
  onSearchChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  selectedCount,
  onBulkDelete,
  error,
  onRetry,
  myUrls,
  debouncedSearch,
  isCopied,
  deletingUrl,
  selectedIds,
  onCopy,
  onDelete,
  onSelect,
  onShare,
  currentPage,
  totalPages,
  onPageChange,
  clickAnalytics
}) => {
  const hasLinksTab = linkTab === 'links';

  const linksBody = useMemo(() => {
    if (loading) {
      return (
        <div
          className={`${formCompoundClass()} dashboard-links-list`}
          aria-busy='true'
          aria-label='Loading links'>
          <ul
            className='dashboard-links-list__items'
            role='list'>
            {[1, 2, 3, 4].map((i) => (
              <UrlTableSkeletonRow key={i} />
            ))}
          </ul>
        </div>
      );
    }

    if (error) {
      return (
        <ErrorRecovery
          error={error}
          onRetry={onRetry}
          title='Failed to load links'
          description="We couldn't fetch your links. Check your connection and try again."
        />
      );
    }

    if (myUrls.length === 0) {
      const emptyMessage = debouncedSearch
        ? `No links match "${debouncedSearch}".`
        : 'Shorten a link above to get started.';

      return (
        <EmptyState
          icon={
            <Link2
              className='h-12 w-12 text-primary'
              strokeWidth={1.5}
              aria-hidden='true'
            />
          }
          title={debouncedSearch ? 'No results' : 'No links yet'}
          description={emptyMessage}
          variant='illustrated'
        />
      );
    }

    return (
      <div className={`${formCompoundClass()} dashboard-links-list`}>
        <ul
          className='dashboard-links-list__items'
          role='list'
          aria-label='Your shortened links'>
          {myUrls.map((url) => (
            <DashboardLinkRow
              key={url._id}
              url={url}
              isCopied={isCopied(buildPublicShortUrl(url.short_url))}
              isDeleting={deletingUrl === url._id}
              isSelected={selectedIds.has(url._id)}
              onCopy={onCopy}
              onDelete={onDelete}
              onSelect={onSelect}
              onShare={onShare}
            />
          ))}
        </ul>
      </div>
    );
  }, [
    loading,
    error,
    myUrls,
    isCopied,
    deletingUrl,
    selectedIds,
    onCopy,
    onDelete,
    onSelect,
    onRetry,
    debouncedSearch,
    onShare
  ]);

  return (
    <section
      ref={linksPanelRef}
      aria-labelledby='links-heading'
      className='dashboard-zone dashboard-zone--divider dashboard-links-panel'>
      <div className='dashboard-links-panel__header'>
        <div>
          <h2
            id='links-heading'
            className='dashboard-links-panel__heading'>
            Your links
          </h2>
          <div
            className='dashboard-links-tabs'
            role='tablist'
            aria-label='View mode'>
            <button
              type='button'
              role='tab'
              aria-selected={hasLinksTab}
              onClick={() => onLinkTabChange('links')}
              className={`dashboard-links-tab${hasLinksTab ? ' dashboard-links-tab--active' : ''}`}>
              All Links
            </button>
            {showClickAnalytics && (
              <button
                type='button'
                role='tab'
                aria-selected={!hasLinksTab}
                onClick={() => onLinkTabChange('analytics')}
                className={`dashboard-links-tab${!hasLinksTab ? ' dashboard-links-tab--active' : ''}`}>
                Analytics
              </button>
            )}
          </div>
        </div>
        <div className='dashboard-links-panel__header-actions'>
          {hasLinksTab && !loading && totalCount > 0 && (
            <label className='dashboard-links-panel__select-all'>
              <input
                type='checkbox'
                checked={isAllSelected}
                onChange={(e) =>
                  e.target.checked ? onSelectAll() : onDeselectAll()
                }
                disabled={loading || isBulkDeleting}
                className='dashboard-links-toolbar__checkbox'
                aria-label={
                  isAllSelected
                    ? 'Deselect all on this page'
                    : 'Select all on this page'
                }
              />
              <span>{isAllSelected ? 'Deselect all' : 'Select all'}</span>
            </label>
          )}
          {hasLinksTab && (
            <button
              type='button'
              onClick={onRefresh}
              disabled={loading}
              className='landing-text-link dashboard-links-panel__refresh shrink-0 text-sm font-medium disabled:opacity-50'
              aria-label={loading ? 'Refreshing links' : 'Refresh link list'}>
              <span className='inline-flex items-center gap-1.5'>
                <RefreshCw
                  className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}
                  aria-hidden='true'
                />
                {loading ? 'Refreshing…' : 'Refresh'}
              </span>
            </button>
          )}
        </div>
      </div>

      {hasLinksTab ? (
        <>
          <DashboardLinksToolbar
            search={search}
            onSearchChange={onSearchChange}
            sortBy={sortBy}
            onSortByChange={onSortByChange}
            sortOrder={sortOrder}
            onSortOrderChange={onSortOrderChange}
            disabled={loading || isBulkDeleting}
            selectedCount={selectedCount}
            onDeselectAll={onDeselectAll}
            onBulkDelete={onBulkDelete}
            isBulkDeleting={isBulkDeleting}
          />

          {linksBody}

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            disabled={loading}
          />
        </>
      ) : (
        <ClickAnalytics clickAnalytics={clickAnalytics} />
      )}
    </section>
  );
};

export default memo(DashboardLinksPanel);
