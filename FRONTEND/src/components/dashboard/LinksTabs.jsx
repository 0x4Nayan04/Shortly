const LinksTabs = ({ linkTab, analyticsTab, onLinkTabChange }) => {
  const onLinksTab = linkTab === 'links';

  return (
    <div className="dashboard-links-tabs" role="tablist" aria-label="View mode">
      <button
        type="button"
        role="tab"
        aria-selected={onLinksTab}
        onClick={() => onLinkTabChange('links')}
        className={`dashboard-links-tab${onLinksTab ? ' dashboard-links-tab--active' : ''}`}
      >
        All Links
      </button>
      {analyticsTab && (
        <button
          type="button"
          role="tab"
          aria-selected={!onLinksTab}
          onClick={() => onLinkTabChange('analytics')}
          className={`dashboard-links-tab${!onLinksTab ? ' dashboard-links-tab--active' : ''}`}
        >
          Analytics
        </button>
      )}
    </div>
  );
};

export default LinksTabs;
