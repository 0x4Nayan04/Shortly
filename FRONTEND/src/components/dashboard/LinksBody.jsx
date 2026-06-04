import { ErrorRecovery } from '../UxEnhancements';
import LinksEmpty from './LinksEmpty';
import LinksList from './LinksList';
import LoadingSkeleton from './LoadingSkeleton';

const LinksBody = ({
  loading,
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
  if (loading) return <LoadingSkeleton />;
  if (error) {
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
    <LinksList
      myUrls={myUrls}
      copiedCheck={copiedCheck}
      deletingUrl={deletingUrl}
      updatingUrl={updatingUrl}
      selectedIds={selectedIds}
      handlers={handlers}
    />
  );
};

export default LinksBody;
