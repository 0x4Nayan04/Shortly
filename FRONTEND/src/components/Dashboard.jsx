import { memo, useCallback, useMemo, useReducer, useRef } from 'react';
import { LiveRegion, useAnnouncement } from './Accessibility';
import ShareModal from './ShareModal';
import AppCatalogShell, {
  LandingFrameInner,
  LandingSectionBlock
} from './app/AppCatalogShell';
import AppNavbar from './app/AppNavbar';
import { useAuth } from '../contexts/AuthContext';
import {
  ConfirmDialog,
  useConfirmDialog,
  useCopyToClipboard,
  useOnlineStatus
} from './UxEnhancements';
import { useDashboard } from '../hooks/useDashboard';
import DashboardStatsZone from './dashboard/DashboardStatsZone';
import DashboardInsightsSection from './dashboard/DashboardInsightsSection';
import DashboardLinksPanel from './dashboard/DashboardLinksPanel';
import EditLinkModal from './EditLinkModal';

const DashboardModals = ({
  shareUrl,
  onShareClose,
  editingLink,
  onEditClose,
  onSaveEdit
}) => (
  <>
    <ShareModal
      isOpen={!!shareUrl}
      onClose={onShareClose}
      shortUrl={shareUrl?.short_url}
      fullUrl={shareUrl?.full_url}
    />
    <EditLinkModal
      isOpen={!!editingLink}
      onClose={onEditClose}
      link={editingLink}
      onSave={onSaveEdit}
    />
  </>
);

const initialDashboardState = {
  deletingUrl: null,
  updatingUrl: null,
  isBulkDeleting: false,
  selectedIds: new Set(),
  shareUrl: null,
  editingLink: null,
  linkTab: 'links'
};

const dashboardReducer = (state, action) => {
  switch (action.type) {
    case 'setDeletingUrl':
      return { ...state, deletingUrl: action.value };
    case 'setUpdatingUrl':
      return { ...state, updatingUrl: action.value };
    case 'setIsBulkDeleting':
      return { ...state, isBulkDeleting: action.value };
    case 'setSelectedIds':
      return {
        ...state,
        selectedIds:
          typeof action.value === 'function'
            ? action.value(state.selectedIds)
            : action.value
      };
    case 'setShareUrl':
      return { ...state, shareUrl: action.value };
    case 'setEditingLink':
      return { ...state, editingLink: action.value };
    case 'setLinkTab':
      return { ...state, linkTab: action.value };
    default:
      return state;
  }
};

const Dashboard = () => {
  const { user, stats, statsLoading, refetchStats } = useAuth();
  const [state, dispatch] = useReducer(dashboardReducer, initialDashboardState);
  const {
    deletingUrl,
    updatingUrl,
    isBulkDeleting,
    selectedIds,
    shareUrl,
    editingLink,
    linkTab
  } = state;

  const [announcement, announce] = useAnnouncement();
  const { isOnline } = useOnlineStatus();
  const { copy, isCopied } = useCopyToClipboard();
  const confirmDialog = useConfirmDialog();
  const insightsPanelRef = useRef(null);
  const linksPanelRef = useRef(null);

  const {
    myUrls,
    loading,
    error,
    currentPage,
    totalPages,
    totalCount,
    search,
    debouncedSearch,
    sortBy,
    sortOrder,
    refresh,
    handleSearchChange,
    handleSortByChange,
    handleSortOrderChange,
    handlePageChange,
    handleDeleteUrl,
    handleEditUrl,
    handleSaveEdit,
    handleToggleDisabled,
    handleSelectUrl,
    handleSelectAll,
    handleDeselectAll,
    handleBulkDelete,
    isAllSelected,
    visibleSelectedIds
  } = useDashboard({
    userId: user?._id,
    announce,
    isOnline,
    confirm: confirmDialog.confirm,
    dispatchUi: dispatch,
    ui: { selectedIds, editingLink },
    refetchStats
  });

  const handleUrlCreated = useCallback(() => refresh(), [refresh]);

  const handlePageChangeWithScroll = useCallback(
    (page) => {
      handlePageChange(page);
      linksPanelRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    },
    [handlePageChange]
  );

  const copyToClipboard = useCallback(
    (url) => {
      copy(url, 'Link copied');
      announce('Link copied to clipboard');
    },
    [copy, announce]
  );

  const rowHandlers = useMemo(
    () => ({
      onCopy: copyToClipboard,
      onDelete: handleDeleteUrl,
      onSelect: handleSelectUrl,
      onShare: (url) => dispatch({ type: 'setShareUrl', value: url }),
      onEdit: handleEditUrl,
      onToggleDisabled: handleToggleDisabled
    }),
    [
      copyToClipboard,
      handleDeleteUrl,
      handleSelectUrl,
      handleEditUrl,
      handleToggleDisabled
    ]
  );

  const userStats = stats?.stats || {
    totalUrls: 0,
    totalClicks: 0,
    avgClicksPerUrl: 0
  };
  const showInsightsGrid =
    !statsLoading &&
    !!stats &&
    ((stats.recentActivity?.length ?? 0) > 0 ||
      (stats.topUrls?.length ?? 0) > 0);
  const showClickAnalytics = !statsLoading && !!stats?.clickAnalytics;

  const toolbarDisabled = loading || isBulkDeleting;

  return (
    <AppCatalogShell>
      <AppNavbar />

      <main
        id="main-content"
        className="flex-1"
        aria-labelledby="dashboard-heading"
      >
        <LiveRegion message={announcement} politeness="polite" />

        <h1 id="dashboard-heading" className="sr-only">
          Dashboard
        </h1>

        <LandingSectionBlock>
          <LandingFrameInner className="dashboard-overview-inner dashboard-layout-grid">
            <DashboardStatsZone
              user={user}
              userStats={userStats}
              statsLoading={statsLoading}
              onUrlCreated={handleUrlCreated}
            />

            <DashboardInsightsSection
              insightsPanelRef={insightsPanelRef}
              statsLoading={statsLoading}
              showInsightsGrid={showInsightsGrid}
              stats={stats}
            />

            <DashboardLinksPanel
              linksPanelRef={linksPanelRef}
              tabs={{
                linkTab,
                onLinkTabChange: (value) =>
                  dispatch({ type: 'setLinkTab', value }),
                analyticsTab: showClickAnalytics,
                clickAnalytics: stats?.clickAnalytics
              }}
              header={{
                loading,
                totalCount,
                selection: {
                  allSelected: isAllSelected,
                  bulkDeleting: isBulkDeleting
                },
                onSelectAll: handleSelectAll,
                onDeselectAll: handleDeselectAll,
                onRefresh: refresh
              }}
              toolbar={{
                search,
                onSearchChange: handleSearchChange,
                sortBy,
                onSortByChange: handleSortByChange,
                sortOrder,
                onSortOrderChange: handleSortOrderChange,
                selectedCount: visibleSelectedIds.size,
                onBulkDelete: handleBulkDelete,
                onDeselectAll: handleDeselectAll,
                disabled: toolbarDisabled,
                isBulkDeleting: isBulkDeleting
              }}
              list={{
                loading,
                error,
                myUrls,
                debouncedSearch,
                onRetry: refresh,
                copiedCheck: isCopied,
                deletingUrl,
                updatingUrl,
                selectedIds: visibleSelectedIds,
                handlers: rowHandlers
              }}
              pagination={{
                currentPage,
                totalPages,
                onPageChange: handlePageChangeWithScroll,
                disabled: loading
              }}
            />
          </LandingFrameInner>
        </LandingSectionBlock>
      </main>

      <ConfirmDialog {...confirmDialog} />

      <DashboardModals
        shareUrl={shareUrl}
        onShareClose={() => dispatch({ type: 'setShareUrl', value: null })}
        editingLink={editingLink}
        onEditClose={() => dispatch({ type: 'setEditingLink', value: null })}
        onSaveEdit={handleSaveEdit}
      />
    </AppCatalogShell>
  );
};

export default memo(Dashboard);
