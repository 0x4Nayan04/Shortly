import { memo } from 'react';
import ClickAnalytics from '../ClickAnalytics';
import DashboardLinksToolbar from '../DashboardLinksToolbar';
import LinksBody from './LinksBody';
import LinksTabs from './LinksTabs';
import PanelHeader from './PanelHeader';
import Pagination from './Pagination';

const DashboardLinksPanel = ({
  linksPanelRef,
  tabs,
  header,
  toolbar,
  list,
  pagination
}) => {
  const { linkTab, onLinkTabChange, analyticsTab, clickAnalytics } = tabs;
  const onLinksTab = linkTab === 'links';

  return (
    <section
      ref={linksPanelRef}
      aria-labelledby="links-heading"
      className="dashboard-zone dashboard-zone--divider dashboard-links-panel"
    >
      <div className="dashboard-links-panel__header">
        <div>
          <h2 id="links-heading" className="dashboard-links-panel__heading">
            Your links
          </h2>
          <LinksTabs
            linkTab={linkTab}
            analyticsTab={analyticsTab}
            onLinkTabChange={onLinkTabChange}
          />
        </div>
        <PanelHeader
          linkTab={linkTab}
          loading={header.loading}
          totalCount={header.totalCount}
          selection={header.selection}
          onSelectAll={header.onSelectAll}
          onDeselectAll={header.onDeselectAll}
          onRefresh={header.onRefresh}
        />
      </div>

      <div
        id="links-tabpanel"
        role="tabpanel"
        aria-labelledby={onLinksTab ? 'links-tab' : 'analytics-tab'}
        tabIndex={0}
        className="flex min-w-0 flex-col gap-[inherit]"
      >
        {onLinksTab ? (
          <>
            <DashboardLinksToolbar
              onSearchChange={toolbar.onSearchChange}
              sortBy={toolbar.sortBy}
              onSortByChange={toolbar.onSortByChange}
              sortOrder={toolbar.sortOrder}
              onSortOrderChange={toolbar.onSortOrderChange}
              disabled={toolbar.disabled}
              selectedCount={toolbar.selectedCount}
              onDeselectAll={toolbar.onDeselectAll}
              onBulkDelete={toolbar.onBulkDelete}
              isBulkDeleting={toolbar.isBulkDeleting}
            />

            <LinksBody {...list} />

            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={pagination.onPageChange}
              disabled={pagination.disabled}
            />
          </>
        ) : (
          <ClickAnalytics clickAnalytics={clickAnalytics} />
        )}
      </div>
    </section>
  );
};

export default memo(DashboardLinksPanel);
