import { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  bulkDeleteUrls,
  deleteShortUrl,
  getMyUrls,
  updateShortUrl
} from '../api/shortUrl.api';
import { getApiPayload } from '../utils/axiosInstance';
import { useUrlStats } from '../hooks/useUrlStats';
import { LiveRegion, useAnnouncement } from './Accessibility';
import EditLinkModal from './EditLinkModal';
import ShareModal from './ShareModal';
import AppCatalogShell, {
  LandingFrameInner,
  LandingSectionBlock
} from './app/AppCatalogShell';
import AppNavbar from './app/AppNavbar';
import { useAuth } from '../contexts/AuthContext';
import {
  ConfirmDialog,
  showToast,
  useConfirmDialog,
  useCopyToClipboard,
  useOnlineStatus
} from './UxEnhancements';
import DashboardStatsZone from './dashboard/DashboardStatsZone';
import DashboardInsightsSection from './dashboard/DashboardInsightsSection';
import DashboardLinksPanel from './dashboard/DashboardLinksPanel';

const PAGE_SIZE = 10;

const Dashboard = () => {
  const { user } = useAuth();
  const [myUrls, setMyUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingUrl, setDeletingUrl] = useState(null);
  const [updatingUrl, setUpdatingUrl] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [shareUrl, setShareUrl] = useState(null);
  const [editingLink, setEditingLink] = useState(null);

  const [linkTab, setLinkTab] = useState('links');
  const [announcement, announce] = useAnnouncement();
  const { isOnline } = useOnlineStatus();
  const { copy, isCopied } = useCopyToClipboard();
  const confirmDialog = useConfirmDialog();
  const insightsPanelRef = useRef(null);
  const linksPanelRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchMyUrls = useCallback(async () => {
    if (!isOnline) {
      showToast.error("You're offline. Cannot refresh links.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const skip = (currentPage - 1) * PAGE_SIZE;
      const response = await getMyUrls({
        limit: PAGE_SIZE,
        skip,
        search: debouncedSearch,
        sortBy,
        sortOrder
      });
      const payload = getApiPayload(response);
      if (payload) {
        const { urls, totalCount: total, totalPages: pages } = payload;
        setMyUrls(urls || []);
        setTotalCount(total || 0);
        setTotalPages(pages || 1);
        setSelectedIds(new Set());
        announce(`Loaded ${urls?.length || 0} links`);
      }
    } catch (err) {
      setError(err);
      showToast.error('Failed to fetch your links');
      announce('Error loading links');
    } finally {
      setLoading(false);
    }
  }, [announce, isOnline, currentPage, debouncedSearch, sortBy, sortOrder]);

  const { stats, loading: statsLoading, refetch: refetchStats } = useUrlStats();

  const refresh = useCallback(() => {
    fetchMyUrls();
    refetchStats();
  }, [fetchMyUrls, refetchStats]);

  const handleUrlCreated = useCallback(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (user?._id) fetchMyUrls();
  }, [user?._id, fetchMyUrls]);

  useEffect(() => {
    if (user?._id) refetchStats();
  }, [user?._id, refetchStats]);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    linksPanelRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }, []);

  const copyToClipboard = useCallback(
    (url) => {
      copy(url, 'Link copied');
      announce('Link copied to clipboard');
    },
    [copy, announce]
  );

  const handleDeleteUrl = useCallback(
    async (urlId, shortUrl) => {
      const confirmed = await confirmDialog.confirm({
        title: 'Delete link',
        message: `Delete "${shortUrl}"? This cannot be undone.`,
        confirmLabel: 'Delete',
        cancelLabel: 'Cancel',
        variant: 'danger'
      });
      if (!confirmed) return;
      if (!isOnline) {
        showToast.error("You're offline. Cannot delete link.");
        return;
      }

      setDeletingUrl(urlId);
      const deleteToast = showToast.loading('Deleting link…');
      try {
        await deleteShortUrl(urlId);
        setTotalCount((prev) => Math.max(0, prev - 1));
        setMyUrls((prev) => prev.filter((url) => url._id !== urlId));
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(urlId);
          return next;
        });
        showToast.dismiss(deleteToast);
        showToast.success('Link deleted');
        announce('Link deleted');
        refetchStats();
      } catch {
        showToast.dismiss(deleteToast);
        showToast.error('Failed to delete link');
        announce('Error deleting link');
        fetchMyUrls();
      } finally {
        setDeletingUrl(null);
      }
    },
    [fetchMyUrls, refetchStats, announce, confirmDialog, isOnline]
  );

  const handleEditUrl = useCallback((url) => {
    setEditingLink(url);
  }, []);

  const handleSaveEdit = useCallback(
    async (updates) => {
      if (!editingLink) return;

      const apiUpdates = {};
      if (updates.full_url !== editingLink.full_url) {
        apiUpdates.full_url = updates.full_url;
      }
      if (updates.short_url.toLowerCase() !== editingLink.short_url) {
        apiUpdates.short_url = updates.short_url;
      }

      if (Object.keys(apiUpdates).length === 0) {
        setEditingLink(null);
        return;
      }

      setUpdatingUrl(editingLink._id);
      try {
        await updateShortUrl(editingLink._id, apiUpdates);
        refresh();
      } finally {
        setUpdatingUrl(null);
      }
    },
    [editingLink, refresh]
  );

  const handleToggleDisabled = useCallback(
    async (url) => {
      const nextDisabled = !url.disabled;
      const confirmed = await confirmDialog.confirm({
        title: nextDisabled ? 'Disable link' : 'Enable link',
        message: nextDisabled
          ? `Disable "${url.short_url}"? Visitors will get a not found response until you enable it again.`
          : `Enable "${url.short_url}" so visitors can use it again?`,
        confirmLabel: nextDisabled ? 'Disable' : 'Enable',
        cancelLabel: 'Cancel',
        variant: nextDisabled ? 'danger' : 'default'
      });
      if (!confirmed) return;

      if (!isOnline) {
        showToast.error("You're offline. Cannot update link.");
        return;
      }

      setUpdatingUrl(url._id);
      const updateToast = showToast.loading(
        nextDisabled ? 'Disabling link...' : 'Enabling link...'
      );
      try {
        await updateShortUrl(url._id, { disabled: nextDisabled });
        showToast.dismiss(updateToast);
        showToast.success(nextDisabled ? 'Link disabled' : 'Link enabled');
        announce(nextDisabled ? 'Link disabled' : 'Link enabled');
        refresh();
      } catch (err) {
        showToast.dismiss(updateToast);
        showToast.error(
          err?.response?.data?.message || 'Failed to update link'
        );
      } finally {
        setUpdatingUrl(null);
      }
    },
    [announce, confirmDialog, refresh, isOnline]
  );

  const handleSelectUrl = useCallback((id, selected) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedIds(new Set(myUrls.map((url) => url._id)));
  }, [myUrls]);

  const handleDeselectAll = useCallback(() => setSelectedIds(new Set()), []);

  const handleBulkDelete = useCallback(async () => {
    const count = selectedIds.size;
    const confirmed = await confirmDialog.confirm({
      title: 'Delete selected links',
      message: `Delete ${count} link${count > 1 ? 's' : ''}? This cannot be undone.`,
      confirmLabel: `Delete ${count}`,
      cancelLabel: 'Cancel',
      variant: 'danger'
    });
    if (!confirmed) return;
    if (!isOnline) {
      showToast.error("You're offline. Cannot delete links.");
      return;
    }

    setIsBulkDeleting(true);
    const deleteToast = showToast.loading(`Deleting ${count} links…`);
    try {
      const response = await bulkDeleteUrls(Array.from(selectedIds));
      const payload = getApiPayload(response);
      const deletedCount = payload?.deletedCount ?? count;
      const skippedCount = payload?.skippedIds?.length ?? 0;
      showToast.dismiss(deleteToast);
      if (skippedCount > 0) {
        showToast.success(
          `Deleted ${deletedCount} link${deletedCount === 1 ? '' : 's'}; ${skippedCount} skipped`
        );
      } else {
        showToast.success(
          `Deleted ${deletedCount} link${deletedCount === 1 ? '' : 's'}`
        );
      }
      announce(`Deleted ${deletedCount} links`);
      setSelectedIds(new Set());
      refresh();
    } catch {
      showToast.dismiss(deleteToast);
      showToast.error('Failed to delete some links');
      announce('Error deleting links');
      fetchMyUrls();
    } finally {
      setIsBulkDeleting(false);
    }
  }, [selectedIds, confirmDialog, isOnline, refresh, fetchMyUrls, announce]);

  const handleSortByChange = useCallback((value) => {
    setSortBy(value);
    setCurrentPage(1);
  }, []);

  const handleSortOrderChange = useCallback((value) => {
    setSortOrder(value);
    setCurrentPage(1);
  }, []);

  const isAllSelected = myUrls.length > 0 && selectedIds.size === myUrls.length;
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

  return (
    <AppCatalogShell>
      <AppNavbar />

      <main
        id='main-content'
        className='flex-1'
        aria-labelledby='dashboard-heading'>
        <LiveRegion
          message={announcement}
          politeness='polite'
        />

        <h1
          id='dashboard-heading'
          className='sr-only'>
          Dashboard
        </h1>

        <LandingSectionBlock>
          <LandingFrameInner className='dashboard-overview-inner dashboard-layout-grid'>
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
              linkTab={linkTab}
              onLinkTabChange={setLinkTab}
              showClickAnalytics={showClickAnalytics}
              loading={loading}
              totalCount={totalCount}
              isAllSelected={isAllSelected}
              isBulkDeleting={isBulkDeleting}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
              onRefresh={fetchMyUrls}
              search={search}
              onSearchChange={setSearch}
              sortBy={sortBy}
              onSortByChange={handleSortByChange}
              sortOrder={sortOrder}
              onSortOrderChange={handleSortOrderChange}
              selectedCount={selectedIds.size}
              onBulkDelete={handleBulkDelete}
              error={error}
              onRetry={fetchMyUrls}
              myUrls={myUrls}
              debouncedSearch={debouncedSearch}
              isCopied={isCopied}
              deletingUrl={deletingUrl}
              updatingUrl={updatingUrl}
              selectedIds={selectedIds}
              onCopy={copyToClipboard}
              onDelete={handleDeleteUrl}
              onSelect={handleSelectUrl}
              onShare={setShareUrl}
              onEdit={handleEditUrl}
              onToggleDisabled={handleToggleDisabled}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              clickAnalytics={stats?.clickAnalytics}
            />
          </LandingFrameInner>
        </LandingSectionBlock>
      </main>

      <ConfirmDialog {...confirmDialog} />

      <ShareModal
        isOpen={!!shareUrl}
        onClose={() => setShareUrl(null)}
        shortUrl={shareUrl?.short_url}
        fullUrl={shareUrl?.full_url}
      />

      <EditLinkModal
        isOpen={!!editingLink}
        onClose={() => setEditingLink(null)}
        link={editingLink}
        onSave={handleSaveEdit}
      />
    </AppCatalogShell>
  );
};

export default memo(Dashboard);
