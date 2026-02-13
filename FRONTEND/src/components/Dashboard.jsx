import { useState, useEffect, useMemo, useCallback, memo } from "react";
import UrlForm from "../components/UrlForm";
import { getMyUrls, deleteShortUrl, bulkDeleteUrls, getUrlStats } from "../api/shortUrl.api";
import { UrlItemSkeleton, StatsSkeleton } from "./LoadingSpinner";
import { LiveRegion, useAnnouncement } from "./Accessibility";
import { showToast, EmptyState, ErrorRecovery, useConfirmDialog, ConfirmDialog, useCopyToClipboard, useOnlineStatus } from "./UxEnhancements";

// Constants for pagination and sorting
const PAGE_SIZE = 10;
const SORT_OPTIONS = [
  { value: "createdAt", label: "Date Created" },
  { value: "click", label: "Clicks" },
  { value: "short_url", label: "Short URL" },
  { value: "full_url", label: "Original URL" },
];

// Memoized URL Item component for better list performance
const UrlItem = memo(({ url, onCopy, onDelete, isCopied, isDeleting, isSelected, onSelect }) => {
  const shortUrlFull = `${import.meta.env.VITE_APP_URL}/${url.short_url}`;

  return (
    <article 
      className={`border rounded-lg p-4 transition-colors ${
        isSelected 
          ? "border-indigo-300 bg-indigo-50" 
          : "border-gray-200 hover:bg-gray-50"
      }`}
      aria-label={`Short URL: ${url.short_url}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Selection Checkbox */}
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(url._id, e.target.checked)}
            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
            aria-label={`Select URL ${url.short_url}`}
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3 mb-2">
              <a
                href={shortUrlFull}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded truncate"
                aria-label={`Open short URL ${shortUrlFull} in new tab`}
              >
                {shortUrlFull}
              </a>
              <span 
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 shrink-0"
                aria-label={`${url.click} clicks`}
              >
                {url.click} clicks
              </span>
            </div>
            <p className="text-gray-600 text-sm truncate" title={url.full_url}>
              <span className="sr-only">Original URL: </span>
              {url.full_url}
            </p>
            <div className="flex items-center space-x-4 mt-1">
              <p className="text-gray-400 text-xs">
                <span className="sr-only">Created on </span>
                <time dateTime={url.createdAt}>
                  Created {new Date(url.createdAt).toLocaleDateString()}
                </time>
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2" role="group" aria-label="URL actions">
          <button
            onClick={() => onCopy(shortUrlFull)}
            className={`p-2 transition-colors rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              isCopied
                ? "text-green-600"
                : "text-gray-400 hover:text-gray-600"
            }`}
            aria-label={isCopied ? "Copied to clipboard" : `Copy ${shortUrlFull} to clipboard`}
            aria-live="polite"
          >
            {isCopied ? (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            )}
          </button>

          <button
            onClick={() => onDelete(url._id, url.short_url)}
            disabled={isDeleting}
            className="p-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            aria-label={isDeleting ? "Deleting URL..." : `Delete URL ${url.short_url}`}
            aria-busy={isDeleting}
          >
            {isDeleting ? (
              <div className="w-5 h-5 animate-spin rounded-full border-2 border-gray-300 border-t-red-600" aria-hidden="true"></div>
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            )}
          </button>
        </div>
      </div>
    </article>
  );
});

UrlItem.displayName = 'UrlItem';

// Memoized Stats Card component
const StatsCard = memo(({ icon, iconBgColor, label, value }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <div className="flex items-center">
      <div className="flex-shrink-0" aria-hidden="true">
        <div className={`w-12 h-12 ${iconBgColor} rounded-lg flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <div className="ml-4">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900" aria-label={`${label}: ${value}`}>{value}</p>
      </div>
    </div>
  </div>
));

StatsCard.displayName = 'StatsCard';

// Simple Activity Chart Component
const ActivityChart = memo(({ data }) => {
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
    return last7Days.map((dateId) => ({
      _id: dateId,
      count: byDate[dateId]?.count ?? 0,
      clicks: byDate[dateId]?.clicks ?? 0,
    }));
  }, [data, last7Days]);

  const maxCount = Math.max(...chartData.map((d) => d.count), 1);
  const hasAnyData = chartData.some((d) => d.count > 0);
  const CHART_HEIGHT = 140;
  const MIN_BAR_HEIGHT = 20;

  if (!hasAnyData) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-gray-500 bg-gray-50 rounded-lg border border-gray-100">
        <svg className="w-10 h-10 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="text-sm font-medium">No activity in the last 7 days</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-100 p-4">
      <div className="flex items-end gap-3" style={{ height: `${CHART_HEIGHT}px` }}>
        {chartData.map((day) => {
          const date = new Date(day._id);
          const dayLabel = date.toLocaleDateString("en-US", { weekday: "short" });
          const barHeightPx =
            day.count === 0
              ? MIN_BAR_HEIGHT
              : Math.max(MIN_BAR_HEIGHT, (day.count / maxCount) * CHART_HEIGHT);

          return (
            <div
              key={day._id}
              className="flex-1 flex flex-col items-center min-w-0"
              title={`${day.count} URLs created, ${day.clicks} clicks`}
            >
              <div
                className="w-full max-w-[40px] bg-indigo-500 rounded-t transition-all duration-300 hover:bg-indigo-600 mt-auto"
                style={{ height: `${barHeightPx}px` }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-2 text-xs font-medium text-gray-500">
        {chartData.map((day) => {
          const date = new Date(day._id);
          const dayLabel = date.toLocaleDateString("en-US", { weekday: "short" });
          return (
            <span key={day._id} className="flex-1 text-center">
              {dayLabel}
            </span>
          );
        })}
      </div>
      <p className="text-xs text-gray-500 text-right mt-3">Last 7 days</p>
    </div>
  );
});

ActivityChart.displayName = 'ActivityChart';

// Top URLs Component
const TopUrls = memo(({ urls }) => {
  if (!urls || urls.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-gray-100">
        <svg className="w-10 h-10 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        <p className="text-sm font-medium">No URLs yet</p>
        <p className="text-xs mt-0.5">Create short URLs to see top performers</p>
      </div>
    );
  }

  const rankStyles = [
    'bg-amber-100 text-amber-800 border-amber-200',
    'bg-slate-100 text-slate-700 border-slate-200',
    'bg-orange-100 text-orange-700 border-orange-200',
  ];

  return (
    <div className="space-y-2">
      {urls.map((url, index) => (
        <div
          key={url._id}
          className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 hover:border-gray-200 transition-colors"
        >
          <span
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold border shrink-0 ${
              index < 3 ? rankStyles[index] : 'bg-gray-50 text-gray-600 border-gray-200'
            }`}
          >
            {index + 1}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate" title={url.short_url}>
              {url.short_url}
            </p>
            <p className="text-xs text-gray-500 truncate mt-0.5" title={url.full_url}>
              {url.full_url}
            </p>
          </div>
          <span className="text-sm font-semibold text-indigo-600 shrink-0 tabular-nums">
            {url.click} {url.click === 1 ? 'click' : 'clicks'}
          </span>
        </div>
      ))}
    </div>
  );
});

TopUrls.displayName = 'TopUrls';

// Pagination Component
const Pagination = memo(({ currentPage, totalPages, onPageChange, disabled }) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const showEllipsisStart = currentPage > 3;
    const showEllipsisEnd = currentPage < totalPages - 2;

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      if (showEllipsisStart) {
        pages.push('...');
      }
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }
      
      if (showEllipsisEnd) {
        pages.push('...');
      }
      
      if (!pages.includes(totalPages)) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <nav className="flex items-center justify-between border-t border-gray-200 pt-4 mt-4" aria-label="Pagination">
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || disabled}
          className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          aria-label="Previous page"
        >
          Previous
        </button>
      </div>

      <div className="flex items-center gap-1">
        {getPageNumbers().map((page, index) => (
          page === '...' ? (
            <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-400">...</span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              disabled={disabled}
              className={`px-3 py-2 text-sm font-medium rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                currentPage === page
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
              } disabled:opacity-50`}
              aria-label={`Page ${page}`}
              aria-current={currentPage === page ? 'page' : undefined}
            >
              {page}
            </button>
          )
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || disabled}
          className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          aria-label="Next page"
        >
          Next
        </button>
      </div>
    </nav>
  );
});

Pagination.displayName = 'Pagination';

// Search and Filter Bar Component
const SearchFilterBar = memo(({ 
  search, 
  onSearchChange, 
  sortBy, 
  onSortByChange, 
  sortOrder, 
  onSortOrderChange,
  disabled 
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      {/* Search Input */}
      <div className="flex-1 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search URLs..."
          disabled={disabled}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          aria-label="Search URLs"
        />
      </div>

      {/* Sort By Dropdown */}
      <div className="flex gap-2">
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            disabled={disabled}
            className="appearance-none pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed w-full min-w-[140px]"
            aria-label="Sort by"
          >
          {SORT_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Sort Order Toggle */}
        <button
          onClick={() => onSortOrderChange(sortOrder === 'desc' ? 'asc' : 'desc')}
          disabled={disabled}
          className="px-3 py-2.5 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
          aria-label={sortOrder === 'desc' ? 'Sort descending' : 'Sort ascending'}
          title={sortOrder === 'desc' ? 'Sort descending' : 'Sort ascending'}
        >
          {sortOrder === 'desc' ? (
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
});

SearchFilterBar.displayName = 'SearchFilterBar';

// Bulk Actions Bar Component
const BulkActionsBar = memo(({ 
  selectedCount, 
  totalCount, 
  onSelectAll, 
  onDeselectAll, 
  onBulkDelete, 
  isAllSelected,
  disabled 
}) => {
  if (totalCount === 0) return null;

  return (
    <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg mb-4">
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isAllSelected}
            onChange={(e) => e.target.checked ? onSelectAll() : onDeselectAll()}
            disabled={disabled}
            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            aria-label={isAllSelected ? "Deselect all URLs" : "Select all URLs"}
          />
          <span className="text-sm text-gray-700">
            {isAllSelected ? "Deselect all" : "Select all"}
          </span>
        </label>
        
        {selectedCount > 0 && (
          <span className="text-sm text-indigo-600 font-medium">
            {selectedCount} selected
          </span>
        )}
      </div>

      {selectedCount > 0 && (
        <button
          onClick={onBulkDelete}
          disabled={disabled}
          className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          aria-label={`Delete ${selectedCount} selected URLs`}
        >
          Delete Selected ({selectedCount})
        </button>
      )}
    </div>
  );
});

BulkActionsBar.displayName = 'BulkActionsBar';

const Dashboard = ({ user }) => {
  // URL list state
  const [myUrls, setMyUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingUrl, setDeletingUrl] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  // Search and sort state
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  
  // Selection state for bulk operations
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  
  // Analytics state
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  
  // UX hooks
  const [announcement, announce] = useAnnouncement();
  const { isOnline } = useOnlineStatus();
  const { copiedText, copy, isCopied } = useCopyToClipboard();
  const confirmDialog = useConfirmDialog();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch URLs with search, sort, and pagination
  const fetchMyUrls = useCallback(async () => {
    if (!isOnline) {
      showToast.error("You're offline. Cannot refresh URLs.");
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
        sortOrder,
      });
      
      if (response && response.data) {
        const { urls, totalCount: total, totalPages: pages } = response.data;
        setMyUrls(urls || []);
        setTotalCount(total || 0);
        setTotalPages(pages || 1);
        setSelectedIds(new Set()); // Clear selection on data change
        announce(`Loaded ${urls?.length || 0} URLs`);
      }
    } catch (err) {
      setError(err);
      showToast.error("Failed to fetch your URLs");
      announce("Error: Failed to fetch your URLs");
      console.error("Error fetching URLs:", err);
    } finally {
      setLoading(false);
    }
  }, [announce, isOnline, currentPage, debouncedSearch, sortBy, sortOrder]);

  // Fetch URL statistics
  const fetchStats = useCallback(async () => {
    if (!isOnline) return;
    
    setStatsLoading(true);
    try {
      const response = await getUrlStats();
      if (response && response.data) {
        setStats(response.data);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setStatsLoading(false);
    }
  }, [isOnline]);

  // Initial fetch and refetch on dependencies change
  useEffect(() => {
    if (user?._id) {
      fetchMyUrls();
    }
  }, [user?._id, fetchMyUrls]);

  useEffect(() => {
    if (user?._id) {
      fetchStats();
    }
  }, [user?._id, fetchStats]);

  // Page change handler
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Copy handler
  const copyToClipboard = useCallback((url) => {
    copy(url, "URL copied to clipboard!");
    announce("URL copied to clipboard");
  }, [copy, announce]);

  // Single delete handler
  const handleDeleteUrl = useCallback(async (urlId, shortUrl) => {
    const confirmed = await confirmDialog.confirm({
      title: "Delete URL",
      message: `Are you sure you want to delete "${shortUrl}"? This action cannot be undone.`,
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      variant: "danger",
    });

    if (!confirmed) return;

    if (!isOnline) {
      showToast.error("You're offline. Cannot delete URL.");
      return;
    }

    setDeletingUrl(urlId);
    const deleteToast = showToast.loading("Deleting URL...");
    
    try {
      await deleteShortUrl(urlId);
      setMyUrls(prev => prev.filter(url => url._id !== urlId));
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(urlId);
        return next;
      });
      showToast.dismiss(deleteToast);
      showToast.success("URL deleted successfully");
      announce("URL deleted successfully");
      // Refresh stats after delete
      fetchStats();
    } catch (err) {
      showToast.dismiss(deleteToast);
      showToast.error("Failed to delete URL");
      announce("Error: Failed to delete URL");
      console.error("Error deleting URL:", err);
      fetchMyUrls();
    } finally {
      setDeletingUrl(null);
    }
  }, [fetchMyUrls, fetchStats, announce, confirmDialog, isOnline]);

  // Selection handlers
  const handleSelectUrl = useCallback((id, selected) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (selected) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedIds(new Set(myUrls.map(url => url._id)));
  }, [myUrls]);

  const handleDeselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Bulk delete handler
  const handleBulkDelete = useCallback(async () => {
    const count = selectedIds.size;
    const confirmed = await confirmDialog.confirm({
      title: "Delete Multiple URLs",
      message: `Are you sure you want to delete ${count} URL${count > 1 ? 's' : ''}? This action cannot be undone.`,
      confirmLabel: `Delete ${count} URL${count > 1 ? 's' : ''}`,
      cancelLabel: "Cancel",
      variant: "danger",
    });

    if (!confirmed) return;

    if (!isOnline) {
      showToast.error("You're offline. Cannot delete URLs.");
      return;
    }

    setIsBulkDeleting(true);
    const deleteToast = showToast.loading(`Deleting ${count} URLs...`);
    
    try {
      await bulkDeleteUrls(Array.from(selectedIds));
      showToast.dismiss(deleteToast);
      showToast.success(`Successfully deleted ${count} URL${count > 1 ? 's' : ''}`);
      announce(`Deleted ${count} URLs`);
      setSelectedIds(new Set());
      fetchMyUrls();
      fetchStats();
    } catch (err) {
      showToast.dismiss(deleteToast);
      showToast.error("Failed to delete some URLs");
      announce("Error: Failed to delete URLs");
      console.error("Error bulk deleting URLs:", err);
      fetchMyUrls();
    } finally {
      setIsBulkDeleting(false);
    }
  }, [selectedIds, confirmDialog, isOnline, fetchMyUrls, fetchStats, announce]);

  // Computed values
  const isAllSelected = myUrls.length > 0 && selectedIds.size === myUrls.length;
  const userStats = stats?.stats || { totalUrls: 0, totalClicks: 0, avgClicksPerUrl: 0 };

  // Memoized URL list rendering
  const urlList = useMemo(() => {
    if (loading) {
      return (
        <div className="space-y-4" aria-busy="true" aria-label="Loading URLs">
          {[1, 2, 3].map((i) => (
            <UrlItemSkeleton key={i} />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <ErrorRecovery
          error={error}
          onRetry={fetchMyUrls}
          title="Failed to load URLs"
          description="We couldn't fetch your URLs. Please check your connection and try again."
        />
      );
    }

    if (myUrls.length === 0) {
      const emptyMessage = debouncedSearch 
        ? `No URLs found matching "${debouncedSearch}"`
        : "Create your first short URL using the form above. It's quick and easy!";
      
      return (
        <EmptyState
          icon={
            <svg
              className="w-12 h-12 text-indigo-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
          }
          title={debouncedSearch ? "No results found" : "No URLs yet"}
          description={emptyMessage}
          variant="illustrated"
        />
      );
    }

    return (
      <div className="space-y-4" role="list" aria-label={`Your URLs, ${myUrls.length} items`}>
        {myUrls.map((url) => (
          <UrlItem
            key={url._id}
            url={url}
            isCopied={isCopied(`${import.meta.env.VITE_APP_URL}/${url.short_url}`)}
            isDeleting={deletingUrl === url._id}
            isSelected={selectedIds.has(url._id)}
            onCopy={copyToClipboard}
            onDelete={handleDeleteUrl}
            onSelect={handleSelectUrl}
          />
        ))}
      </div>
    );
  }, [loading, error, myUrls, isCopied, deletingUrl, selectedIds, copyToClipboard, handleDeleteUrl, handleSelectUrl, fetchMyUrls, debouncedSearch]);

  return (
    <main id="main-content" className="min-h-[calc(100vh-4rem)] bg-gray-50" role="main">
      {/* Live region for screen reader announcements */}
      <LiveRegion message={announcement} politeness="polite" />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Enhanced Welcome Section */}
        <header className="mb-8">
          <div className="flex items-center space-x-6 mb-6">
            <div className="relative">
              <img
                src={user.avatar}
                alt=""
                aria-hidden="true"
                className="w-16 h-16 rounded-full shadow-lg"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "flex";
                }}
              />
              <div className="w-16 h-16 bg-blue-100 rounded-full items-center justify-center shadow-lg hidden" aria-hidden="true">
                <span className="text-2xl font-bold text-blue-600">
                  {(user.name || user.email || "U").charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full" aria-hidden="true"></div>
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                Welcome back, {user.name || user.email}!
              </h1>
              <p className="text-gray-600 mb-3">
                Create and manage your short URLs
              </p>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>{user.email}</span>
                <span aria-hidden="true">•</span>
                <span>
                  Member since{" "}
                  <time dateTime={user.createdAt || new Date().toISOString()}>
                    {new Date(user.createdAt || Date.now()).toLocaleDateString(
                      "en-US",
                      { month: "short", year: "numeric" }
                    )}
                  </time>
                </span>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          {statsLoading ? (
            <StatsSkeleton />
          ) : (
            <section aria-label="Your statistics" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatsCard
                iconBgColor="bg-blue-100"
                icon={
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                }
                label="Total URLs"
                value={userStats.totalUrls}
              />

              <StatsCard
                iconBgColor="bg-green-100"
                icon={
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                    />
                  </svg>
                }
                label="Total Clicks"
                value={userStats.totalClicks}
              />

              <StatsCard
                iconBgColor="bg-purple-100"
                icon={
                  <svg
                    className="w-6 h-6 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                }
                label="Avg. Clicks/URL"
                value={userStats.avgClicksPerUrl}
              />
            </section>
          )}
        </header>

        {/* Analytics Section */}
        {!statsLoading && stats && (
          <section aria-label="Analytics" className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
            <div className="flex flex-col lg:flex-row lg:divide-x divide-gray-200">
              <div className="flex-1 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Recent Activity</h3>
                <p className="text-sm text-gray-500 mb-4">URLs created per day</p>
                <ActivityChart data={stats.recentActivity} />
              </div>

              <div className="flex-1 p-6 border-t lg:border-t-0 border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Top Performing URLs</h3>
                <p className="text-sm text-gray-500 mb-4">By click count</p>
                <TopUrls urls={stats.topUrls} />
              </div>
            </div>
          </section>
        )}

        {/* Create URL Section */}
        <section aria-labelledby="create-url-heading" className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          <h2 id="create-url-heading" className="text-xl font-semibold text-gray-900 mb-6">
            Create New Short URL
          </h2>
          <UrlForm onUrlCreated={() => { fetchMyUrls(); fetchStats(); }} user={user} />
        </section>

        {/* My URLs Section */}
        <section aria-labelledby="my-urls-heading" className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 id="my-urls-heading" className="text-xl font-semibold text-gray-900">My URLs</h2>
              <p className="text-sm text-gray-500 mt-1">
                {totalCount > 0 ? `${totalCount} URL${totalCount !== 1 ? 's' : ''} total` : ''}
              </p>
            </div>
            <button
              onClick={fetchMyUrls}
              disabled={loading}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded px-2 py-1"
              aria-label={loading ? "Refreshing URL list" : "Refresh URL list"}
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {/* Search and Filter */}
          <SearchFilterBar
            search={search}
            onSearchChange={setSearch}
            sortBy={sortBy}
            onSortByChange={(value) => { setSortBy(value); setCurrentPage(1); }}
            sortOrder={sortOrder}
            onSortOrderChange={(value) => { setSortOrder(value); setCurrentPage(1); }}
            disabled={loading}
          />

          {/* Bulk Actions */}
          <BulkActionsBar
            selectedCount={selectedIds.size}
            totalCount={myUrls.length}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
            onBulkDelete={handleBulkDelete}
            isAllSelected={isAllSelected}
            disabled={loading || isBulkDeleting}
          />

          {/* URL List */}
          {urlList}

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            disabled={loading}
          />
        </section>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog {...confirmDialog} />
    </main>
  );
};

export default memo(Dashboard);
