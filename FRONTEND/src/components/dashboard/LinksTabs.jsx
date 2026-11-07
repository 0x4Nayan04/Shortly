const LinksTabs = ({ linkTab, analyticsTab, onLinkTabChange }) => {
  const onLinksTab = linkTab === 'links';
  const handleKeyDown = (event) => {
    const tabs = [...event.currentTarget.querySelectorAll('[role="tab"]')];
    const index = tabs.indexOf(document.activeElement);
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft')
      next = (index - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next !== undefined) {
      event.preventDefault();
      tabs[next].focus();
      tabs[next].click();
    }
  };

  return (
    <div
      className="dashboard-links-tabs"
      role="tablist"
      aria-label="View mode"
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        role="tab"
        id="links-tab"
        aria-controls="links-tabpanel"
        tabIndex={onLinksTab ? 0 : -1}
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
          id="analytics-tab"
          aria-controls="links-tabpanel"
          tabIndex={onLinksTab ? -1 : 0}
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
