import { ErrorRecovery } from '../UxEnhancements';
import LinksEmpty from './LinksEmpty';
import LinksList from './LinksList';
import LoadingSkeleton from './LoadingSkeleton';

const LinksBody = ({
  loading,
  isRefreshing = false,
  error,
  myUrls,
  debouncedSearch,
  onRetry,
  copiedCheck,
  deletingUrl,
  updatingUrl,
  selectedIds,
  handlers
}) => {
  // Skeleton only on first load — keep prior rows visible while search/sort refetches.
  if (loading && myUrls.length === 0) return <LoadingSkeleton />;
  if (error && myUrls.length === 0) {
    return (
      <ErrorRecovery
        error={error}
        onRetry={onRetry}
        title="Failed to load links"
        description="We couldn't fetch your links. Check your connection and try again."
      />
    );
  }
  if (myUrls.length === 0)
    return <LinksEmpty debouncedSearch={debouncedSearch} />;
  return (
    <div
      className={
        isRefreshing ? 'dashboard-links-body dashboard-links-body--refreshing' : undefined
      }
      aria-busy={isRefreshing || undefined}
    >
      <LinksList
        myUrls={myUrls}
        copiedCheck={copiedCheck}
        deletingUrl={deletingUrl}
        updatingUrl={updatingUrl}
        selectedIds={selectedIds}
        handlers={handlers}
      />
    </div>
  );
};

export default LinksBody;
