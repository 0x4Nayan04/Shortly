import { RefreshCw } from 'lucide-react';

const RefreshButton = ({ loading, onRefresh }) => (
  <button
    type="button"
    onClick={onRefresh}
    disabled={loading}
    className="landing-text-link dashboard-links-panel__refresh shrink-0 text-sm font-medium disabled:opacity-50"
    aria-label={loading ? 'Refreshing links' : 'Refresh link list'}
  >
    <span className="inline-flex items-center gap-1.5">
      <RefreshCw
        className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}
        aria-hidden="true"
      />
      {loading ? 'Refreshing…' : 'Refresh'}
    </span>
  </button>
);

export default RefreshButton;
