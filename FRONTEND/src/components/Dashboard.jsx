import { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  bulkDeleteUrls,
  deleteShortUrl,
  getMyUrls,
  getUrlStats,
  updateShortUrl
} from '../api/shortUrl.api';
import { getApiPayload } from '../utils/axiosInstance';
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
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

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
      console.error('Error fetching URLs:', err);
    } finally {
      setLoading(false);
    }
  }, [announce, isOnline, currentPage, debouncedSearch, sortBy, sortOrder]);

  const fetchStats = useCallback(async () => {
    if (!isOnline) return;
    setStatsLoading(true);
    try {
      const response = await getUrlStats();
      const payload = getApiPayload(response);
      if (payload) setStats(payload);
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, [isOnline]);

  const handleUrlCreated = useCallback(() => {
    fetchMyUrls();
    fetchStats();
  }, [fetchMyUrls, fetchStats]);

  useEffect(() => {
    if (user?._id) fetchMyUrls();
  }, [user?._id, fetchMyUrls]);

  useEffect(() => {
    if (user?._id) fetchStats();
  }, [user?._id, fetchStats]);

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

  const handleShareUrl = useCallback((url) => setShareUrl(url), []);

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
        fetchStats();
      } catch (err) {
        showToast.dismiss(deleteToast);
        showToast.error('Failed to delete link');
        announce('Error deleting link');
        console.error('Error deleting URL:', err);
        fetchMyUrls();
      } finally {
        setDeletingUrl(null);
      }
    },
    [fetchMyUrls, fetchStats, announce, confirmDialog, isOnline]
  );

  const handleEditUrl = useCallback(
    async (url) => {
      const nextDestination = window.prompt(
        'Update destination URL',
        url.full_url
      );
      if (nextDestination === null) return;

      const trimmedDestination = nextDestination.trim();
      if (!trimmedDestination) {
        showToast.error('Destination URL is required');
        return;
      }

      const nextSlug = window.prompt('Update short alias', url.short_url);
      if (nextSlug === null) return;

      const trimmedSlug = nextSlug.trim();
      if (!trimmedSlug) {
        showToast.error('Short alias is required');
        return;
      }

      const updates = {};
      if (trimmedDestination !== url.full_url) {
        updates.full_url = trimmedDestination;
      }
      if (trimmedSlug.toLowerCase() !== url.short_url) {
        updates.short_url = trimmedSlug;
      }

      if (Object.keys(updates).length === 0) return;

      if (!isOnline) {
        showToast.error("You're offline. Cannot update link.");
        return;
      }

      setUpdatingUrl(url._id);
      const updateToast = showToast.loading('Updating link...');
      try {
        await updateShortUrl(url._id, updates);
        showToast.dismiss(updateToast);
        showToast.success('Link updated');
        announce('Link updated');
        fetchMyUrls();
        fetchStats();
      } catch (err) {
        showToast.dismiss(updateToast);
        showToast.error(
          err?.response?.data?.message || 'Failed to update link'
        );
        console.error('Error updating URL:', err);
      } finally {
        setUpdatingUrl(null);
      }
    },
    [announce, fetchMyUrls, fetchStats, isOnline]
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
        fetchMyUrls();
        fetchStats();
      } catch (err) {
        showToast.dismiss(updateToast);
        showToast.error(
          err?.response?.data?.message || 'Failed to update link'
        );
        console.error('Error updating URL:', err);
      } finally {
        setUpdatingUrl(null);
      }
    },
    [announce, confirmDialog, fetchMyUrls, fetchStats, isOnline]
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
      fetchMyUrls();
      fetchStats();
    } catch (err) {
      showToast.dismiss(deleteToast);
      showToast.error('Failed to delete some links');
      announce('Error deleting links');
      console.error('Error bulk deleting URLs:', err);
      fetchMyUrls();
    } finally {
      setIsBulkDeleting(false);
    }
  }, [selectedIds, confirmDialog, isOnline, fetchMyUrls, fetchStats, announce]);

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
              onShare={handleShareUrl}
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
    </AppCatalogShell>
  );
};

export default memo(Dashboard);
