import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart3,
  Link2,
  RefreshCw,
  MousePointerClick,
  Activity
} from 'lucide-react';
import {
  bulkDeleteUrls,
  deleteShortUrl,
  getMyUrls,
  getUrlStats
} from '../api/shortUrl.api';
import { getApiPayload } from '../utils/axiosInstance';
import UrlForm from './UrlForm';
import { LiveRegion, useAnnouncement } from './Accessibility';
import {
  DashboardStatsGridSkeleton,
  UrlTableSkeletonRow
} from './LoadingSpinner';
import ClickAnalytics from './ClickAnalytics';
import ShareModal from './ShareModal';
import DashboardLinkRow from './DashboardLinkRow';
import DashboardLinksToolbar from './DashboardLinksToolbar';
import {
  buildPublicShortUrl,
  getShortLinkDisplayParts
} from '../utils/publicShortUrl';
import { formCompoundClass } from '../utils/designFormClasses';
import AppCatalogShell, {
  LandingFrameInner,
  LandingSectionBlock
} from './app/AppCatalogShell';
import AppNavbar from './app/AppNavbar';
import {
  ConfirmDialog,
  EmptyState,
  ErrorRecovery,
  showToast,
  useConfirmDialog,
  useCopyToClipboard,
  useOnlineStatus
} from './UxEnhancements';

const PAGE_SIZE = 10;

const ActivityChart = memo(({ data }) => {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const last7Days = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().slice(0, 10));
    }
    return days;
  }, []);

  const chartData = useMemo(() => {
    const byDate = (data || []).reduce((acc, d) => {
      acc[d._id] = { count: d.count, clicks: d.clicks || 0 };
      return acc;
    }, {});
    return last7Days.map((dateId, i) => ({
      _id: dateId,
      count: byDate[dateId]?.count ?? 0,
      clicks: byDate[dateId]?.clicks ?? 0,
      isToday: i === 6,
      isYesterday: i === 5
    }));
  }, [data, last7Days]);

  const totalLinks = chartData.reduce((s, d) => s + d.count, 0);
  const maxCount = Math.max(...chartData.map((d) => d.count), 1);
  const hasAnyData = chartData.some((d) => d.count > 0);
  const todayCount = chartData[chartData.length - 1]?.count ?? 0;
  const GRID_LINES = 3;

  if (!hasAnyData) {
    return (
      <div className='activity-chart activity-chart--empty'>
        <BarChart3
          className='activity-chart__empty-icon'
          strokeWidth={1.5}
          aria-hidden='true'
        />
        <p className='activity-chart__empty-text'>No links created yet</p>
        <p className='activity-chart__empty-hint'>
          Shorten your first URL above to get started
        </p>
      </div>
    );
  }

  return (
    <div className='activity-chart'>
      {/* Summary row */}
      <div className='activity-chart__summary'>
        <div className='activity-chart__summary-main'>
          <span className='activity-chart__total'>{totalLinks}</span>
          <span className='activity-chart__total-label'>
            link{totalLinks !== 1 ? 's' : ''} created this week
          </span>
        </div>
        {todayCount > 0 && (
          <div className='activity-chart__today-badge'>{todayCount} today</div>
        )}
      </div>

      {/* Chart area */}
      <div className='activity-chart__body'>
        {/* Y-axis scale */}
        <div
          className='activity-chart__yaxis'
          aria-hidden='true'>
          <span>{maxCount}</span>
          <span>{Math.round(maxCount / 2)}</span>
          <span>0</span>
        </div>

        {/* Bars + grid */}
        <div className='activity-chart__plot'>
          {/* Grid lines */}
          <div
            className='activity-chart__grid'
            aria-hidden='true'>
            {Array.from({ length: GRID_LINES + 1 }, (_, i) => (
              <div
                key={i}
                className='activity-chart__gridline'
                style={{ bottom: `${(i / GRID_LINES) * 100}%` }}
              />
            ))}
          </div>

          {/* Bars */}
          <div className='activity-chart__bars'>
            {chartData.map((day, idx) => {
              const date = new Date(day._id + 'T00:00:00');
              const dayLabel = date.toLocaleDateString('en-US', {
                weekday: 'short'
              });
              const dateLabel = date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              });
              const barPct = day.count === 0 ? 0 : (day.count / maxCount) * 100;
              const isHovered = hoveredIdx === idx;

              return (
                <div
                  key={day._id}
                  className={`activity-chart__col${day.isToday ? ' activity-chart__col--today' : ''}`}
                  tabIndex={0}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onFocus={() => setHoveredIdx(idx)}
                  onBlur={() => setHoveredIdx(null)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setHoveredIdx(idx);
                    }
                  }}>
                  {/* Tooltip */}
                  {isHovered && (
                    <div className='activity-chart__tooltip'>
                      <strong>
                        {day.count} link{day.count !== 1 ? 's' : ''}
                      </strong>
                      <span>{dateLabel}</span>
                    </div>
                  )}

                  {/* Value label above bar */}
                  {day.count > 0 && (
                    <span
                      className={`activity-chart__value${isHovered ? ' activity-chart__value--visible' : ''}`}>
                      {day.count}
                    </span>
                  )}

                  {/* Bar */}
                  <div className='activity-chart__bar-track'>
                    <div
                      className={`activity-chart__bar${day.count === 0 ? ' activity-chart__bar--empty' : ''}${day.isToday ? ' activity-chart__bar--today' : ''}`}
                      style={{
                        height: barPct ? `${Math.max(barPct, 4)}%` : '3px'
                      }}
                    />
                  </div>

                  {/* Day label */}
                  <span
                    className={`activity-chart__day${day.isToday ? ' activity-chart__day--today' : ''}`}>
                    {dayLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
});

ActivityChart.displayName = 'ActivityChart';

const TopUrls = memo(({ urls }) => {
  if (!urls?.length) {
    return (
      <div className='top-urls-empty'>
        <Link2
          className='top-urls-empty__icon'
          strokeWidth={1.5}
          aria-hidden='true'
        />
        <p className='top-urls-empty__text'>No links yet</p>
        <p className='top-urls-empty__hint'>
          Create links to see top performers
        </p>
      </div>
    );
  }

  return (
    <ul className='top-urls-list'>
      {urls.map((url, index) => {
        const shortUrlFull = buildPublicShortUrl(url.short_url);
        const { hostLead, hostTrail, slug } = getShortLinkDisplayParts(
          url.short_url
        );

        return (
          <li
            key={url._id}
            className='top-url-item'>
            <span className='top-url-item__rank'>{index + 1}</span>
            <div className='top-url-item__body'>
              <div
                className='top-url-item__short'
                title={shortUrlFull}>
                {hostLead ? (
                  <span className='top-url-item__short-inner'>
                    <span className='top-url-item__host top-url-item__host--truncate'>
                      {hostLead}
                    </span>
                    {hostTrail ? (
                      <span className='top-url-item__host'>{hostTrail}</span>
                    ) : null}
                    <span className='top-url-item__slug'>/</span>
                    <span className='top-url-item__slug'>{slug}</span>
                  </span>
                ) : (
                  <span className='top-url-item__short-fallback'>/{slug}</span>
                )}
              </div>
              <p
                className='top-url-item__dest'
                title={url.full_url}>
                {url.full_url}
              </p>
            </div>
            <p className='top-url-item__clicks'>
              <span className='top-url-item__clicks-value'>{url.click}</span>
              <span className='top-url-item__clicks-label'>
                {url.click === 1 ? 'click' : 'clicks'}
              </span>
            </p>
          </li>
        );
      })}
    </ul>
  );
});

TopUrls.displayName = 'TopUrls';

const Pagination = memo(
  ({ currentPage, totalPages, onPageChange, disabled }) => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      const pages = [];
      const showEllipsisStart = currentPage > 3;
      const showEllipsisEnd = currentPage < totalPages - 2;

      if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        if (showEllipsisStart) pages.push('...');
        const start = Math.max(2, currentPage - 1);
        const end = Math.min(totalPages - 1, currentPage + 1);
        for (let i = start; i <= end; i++) {
          if (!pages.includes(i)) pages.push(i);
        }
        if (showEllipsisEnd) pages.push('...');
        if (!pages.includes(totalPages)) pages.push(totalPages);
      }
      return pages;
    };

    return (
      <nav
        className='mt-4 flex flex-col items-center justify-between gap-4 border-t border-border pt-4 sm:flex-row'
        aria-label='Pagination'>
        {currentPage > 1 && (
          <button
            type='button'
            onClick={() => onPageChange(currentPage - 1)}
            disabled={disabled}
            className='sm-btn sm-btn-secondary w-full sm:w-auto'
            aria-label='Previous page'>
            Previous
          </button>
        )}

        <div className='flex flex-wrap items-center justify-center gap-1'>
          {getPageNumbers().map((page, index) =>
            page === '...' ? (
              <span
                key={`ellipsis-${index}`}
                className='px-2 py-1 text-muted'>
                …
              </span>
            ) : (
              <button
                key={page}
                type='button'
                onClick={() => onPageChange(page)}
                disabled={disabled}
                className={`sm-btn min-w-[2.5rem] px-3 ${
                  currentPage === page ? 'sm-btn-primary' : 'sm-btn-secondary'
                }`}
                aria-label={`Page ${page}`}
                aria-current={currentPage === page ? 'page' : undefined}>
                {page}
              </button>
            )
          )}
        </div>

        {currentPage < totalPages && (
          <button
            type='button'
            onClick={() => onPageChange(currentPage + 1)}
            disabled={disabled}
            className='sm-btn sm-btn-secondary w-full sm:w-auto'
            aria-label='Next page'>
            Next
          </button>
        )}
      </nav>
    );
  }
);

Pagination.displayName = 'Pagination';

const Dashboard = ({ user, onLogout, onShowAuth, onShowProfile }) => {
  const [myUrls, setMyUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingUrl, setDeletingUrl] = useState(null);
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
      await bulkDeleteUrls(Array.from(selectedIds));
      showToast.dismiss(deleteToast);
      showToast.success(`Deleted ${count} link${count > 1 ? 's' : ''}`);
      announce(`Deleted ${count} links`);
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
          onRetry={fetchMyUrls}
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
              onCopy={copyToClipboard}
              onDelete={handleDeleteUrl}
              onSelect={handleSelectUrl}
              onShare={handleShareUrl}
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
    copyToClipboard,
    handleDeleteUrl,
    handleSelectUrl,
    fetchMyUrls,
    debouncedSearch,
    handleShareUrl
  ]);

  return (
    <AppCatalogShell>
      <AppNavbar
        user={user}
        onLogout={onLogout}
        onShowAuth={onShowAuth}
        onShowProfile={onShowProfile}
      />

      <main
        id='main-content'
        className='flex-1'
        role='main'
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
            <section
              className='dashboard-zone dashboard-stats-zone'
              aria-labelledby='dashboard-overview-heading'>
              <h2
                id='dashboard-overview-heading'
                className='sr-only'>
                Overview
              </h2>

              <UrlForm
                user={user}
                variant='landing'
                onUrlCreated={() => {
                  fetchMyUrls();
                  fetchStats();
                }}
              />

              <div
                className='dashboard-stats-row'
                aria-busy={statsLoading}>
                {statsLoading ? (
                  <DashboardStatsGridSkeleton />
                ) : (
                  <>
                    <div className='app-panel dashboard-stat-card dashboard-stat-card--links'>
                      <div className='dashboard-stat__header'>
                        <Link2
                          className='dashboard-stat__icon'
                          aria-hidden='true'
                          strokeWidth={2}
                        />
                        <p className='dashboard-stat__label'>Total links</p>
                      </div>
                      <p className='dashboard-stat__value tabular-nums'>
                        {userStats.totalUrls.toLocaleString()}
                      </p>
                    </div>
                    <div className='app-panel dashboard-stat-card dashboard-stat-card--clicks'>
                      <div className='dashboard-stat__header'>
                        <MousePointerClick
                          className='dashboard-stat__icon'
                          aria-hidden='true'
                          strokeWidth={2}
                        />
                        <p className='dashboard-stat__label'>
                          Total clicks (all time)
                        </p>
                      </div>
                      <p className='dashboard-stat__value tabular-nums'>
                        {userStats.totalClicks.toLocaleString()}
                      </p>
                    </div>
                    <div className='app-panel dashboard-stat-card dashboard-stat-card--avg'>
                      <div className='dashboard-stat__header'>
                        <Activity
                          className='dashboard-stat__icon'
                          aria-hidden='true'
                          strokeWidth={2}
                        />
                        <p className='dashboard-stat__label'>Avg clicks/link</p>
                      </div>
                      <p className='dashboard-stat__value tabular-nums'>
                        {userStats.avgClicksPerUrl.toLocaleString()}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </section>

            {(statsLoading || showInsightsGrid) && (
              <section
                ref={insightsPanelRef}
                className='dashboard-zone dashboard-zone--divider dashboard-insights-zone scroll-mt-[calc(var(--nav-height)+var(--section-bar-height))]'
                aria-labelledby='dashboard-insights-heading'>
                <h2
                  id='dashboard-insights-heading'
                  className='sr-only'>
                  Insights
                </h2>
                {statsLoading ? (
                  <div
                    className='dashboard-insights-grid'
                    aria-busy='true'>
                    <div className='app-panel dashboard-insights-panel dashboard-insights-panel--skeleton'>
                      <div className='sm-skeleton sm-skeleton--shimmer dashboard-insights-skeleton__title' />
                      <div className='sm-skeleton sm-skeleton--shimmer dashboard-insights-skeleton__body' />
                    </div>
                    <div className='app-panel dashboard-insights-panel dashboard-insights-panel--skeleton'>
                      <div className='sm-skeleton sm-skeleton--shimmer dashboard-insights-skeleton__title' />
                      <div className='sm-skeleton sm-skeleton--shimmer dashboard-insights-skeleton__body' />
                    </div>
                  </div>
                ) : (
                  <div className='dashboard-insights-grid'>
                    <section
                      aria-labelledby='dashboard-recent-activity-heading'
                      className='app-panel dashboard-insights-panel'>
                      <header className='dashboard-insights-panel__header'>
                        <h3
                          id='dashboard-recent-activity-heading'
                          className='dashboard-insights-panel__title'>
                          Last 7 days
                        </h3>
                        <p className='dashboard-insights-panel__subtitle'>
                          New links created each day
                        </p>
                      </header>
                      <ActivityChart data={stats?.recentActivity || []} />
                    </section>
                    <section
                      aria-labelledby='dashboard-top-links-heading'
                      className='app-panel dashboard-insights-panel'>
                      <header className='dashboard-insights-panel__header'>
                        <h3
                          id='dashboard-top-links-heading'
                          className='dashboard-insights-panel__title'>
                          Top performers
                        </h3>
                        <p className='dashboard-insights-panel__subtitle'>
                          Ranked by total clicks
                        </p>
                      </header>
                      <TopUrls urls={stats?.topUrls || []} />
                    </section>
                  </div>
                )}
              </section>
            )}

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
                      onClick={() => setLinkTab('links')}
                      className={`dashboard-links-tab${hasLinksTab ? ' dashboard-links-tab--active' : ''}`}>
                      All Links
                    </button>
                    {showClickAnalytics && (
                      <button
                        type='button'
                        role='tab'
                        aria-selected={!hasLinksTab}
                        onClick={() => setLinkTab('analytics')}
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
                          e.target.checked
                            ? handleSelectAll()
                            : handleDeselectAll()
                        }
                        disabled={loading || isBulkDeleting}
                        className='dashboard-links-toolbar__checkbox'
                        aria-label={
                          isAllSelected
                            ? 'Deselect all on this page'
                            : 'Select all on this page'
                        }
                      />
                      <span>
                        {isAllSelected ? 'Deselect all' : 'Select all'}
                      </span>
                    </label>
                  )}
                  {hasLinksTab && (
                    <button
                      type='button'
                      onClick={fetchMyUrls}
                      disabled={loading}
                      className='landing-text-link dashboard-links-panel__refresh shrink-0 text-sm font-medium disabled:opacity-50'
                      aria-label={
                        loading ? 'Refreshing links' : 'Refresh link list'
                      }>
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
                    onSearchChange={setSearch}
                    sortBy={sortBy}
                    onSortByChange={(value) => {
                      setSortBy(value);
                      setCurrentPage(1);
                    }}
                    sortOrder={sortOrder}
                    onSortOrderChange={(value) => {
                      setSortOrder(value);
                      setCurrentPage(1);
                    }}
                    disabled={loading || isBulkDeleting}
                    selectedCount={selectedIds.size}
                    onDeselectAll={handleDeselectAll}
                    onBulkDelete={handleBulkDelete}
                    isBulkDeleting={isBulkDeleting}
                  />

                  {linksBody}

                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    disabled={loading}
                  />
                </>
              ) : (
                <ClickAnalytics clickAnalytics={stats.clickAnalytics} />
              )}
            </section>
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
