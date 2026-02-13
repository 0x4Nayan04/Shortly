import { useState, useEffect, useMemo, useCallback, memo } from "react";
import UrlForm from "../components/UrlForm";
import { getMyUrls, deleteShortUrl } from "../api/shortUrl.api";
import { UrlItemSkeleton, StatsSkeleton } from "./LoadingSpinner";
import { LiveRegion, useAnnouncement } from "./Accessibility";
import { showToast, EmptyState, ErrorRecovery, useConfirmDialog, ConfirmDialog, useCopyToClipboard, useOnlineStatus } from "./UxEnhancements";

// Memoized URL Item component for better list performance
const UrlItem = memo(({ url, onCopy, onDelete, isCopied, isDeleting }) => {
  const shortUrlFull = `${import.meta.env.VITE_APP_URL}/${url.short_url}`;

  return (
    <article 
      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
      aria-label={`Short URL: ${url.short_url}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3 mb-2">
            <a
              href={shortUrlFull}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded"
              aria-label={`Open short URL ${shortUrlFull} in new tab`}
            >
              {shortUrlFull}
            </a>
            <span 
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
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
const StatsCard = memo(({ icon, iconBgColor, iconColor, label, value }) => (
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

const Dashboard = ({ user }) => {
  const [myUrls, setMyUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingUrl, setDeletingUrl] = useState(null);
  const [announcement, announce] = useAnnouncement();
  const { isOnline } = useOnlineStatus();
  const { copiedText, copy, isCopied } = useCopyToClipboard();
  const confirmDialog = useConfirmDialog();

  // Memoize user stats calculation for better performance
  const userStats = useMemo(() => {
    const totalClicks = myUrls.reduce((sum, url) => sum + (url.click || 0), 0);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentUrls = myUrls.filter((url) => {
      const createdDate = new Date(url.createdAt);
      return createdDate > sevenDaysAgo;
    });

    return {
      totalUrls: myUrls.length,
      totalClicks,
      recentActivity: recentUrls.length,
    };
  }, [myUrls]);

  // Memoized fetch function
  const fetchMyUrls = useCallback(async () => {
    if (!isOnline) {
      showToast.error("You're offline. Cannot refresh URLs.");
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      // Load first 50 URLs for better performance
      const response = await getMyUrls(50, 0);
      if (response && response.data && response.data.urls) {
        const urls = response.data.urls;
        setMyUrls(urls);
        announce(`Loaded ${urls.length} URLs`);
      }
    } catch (err) {
      setError(err);
      showToast.error("Failed to fetch your URLs");
      announce("Error: Failed to fetch your URLs");
      console.error("Error fetching URLs:", err);
    } finally {
      setLoading(false);
    }
  }, [announce, isOnline]);

  useEffect(() => {
    if (user?._id) fetchMyUrls();
  }, [user?._id, fetchMyUrls]);

  // Memoized copy handler using the new hook
  const copyToClipboard = useCallback((url) => {
    copy(url, "URL copied to clipboard!");
    announce("URL copied to clipboard");
  }, [copy, announce]);

  // Memoized delete handler with confirmation dialog
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
      // Optimistic update - remove from local state immediately
      setMyUrls(prev => prev.filter(url => url._id !== urlId));
      showToast.dismiss(deleteToast);
      showToast.success("URL deleted successfully");
      announce("URL deleted successfully");
    } catch (err) {
      showToast.dismiss(deleteToast);
      showToast.error("Failed to delete URL");
      announce("Error: Failed to delete URL");
      console.error("Error deleting URL:", err);
      // Refresh list on error to sync state
      fetchMyUrls();
    } finally {
      setDeletingUrl(null);
    }
  }, [fetchMyUrls, announce, confirmDialog, isOnline]);

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
          title="No URLs yet"
          description="Create your first short URL using the form above. It's quick and easy!"
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
            onCopy={copyToClipboard}
            onDelete={handleDeleteUrl}
          />
        ))}
      </div>
    );
  }, [loading, error, myUrls, isCopied, deletingUrl, copyToClipboard, handleDeleteUrl, fetchMyUrls]);

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
          {loading ? (
            <StatsSkeleton />
          ) : (
            <section aria-label="Your statistics" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatsCard
                iconBgColor="bg-blue-100"
                iconColor="text-blue-600"
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
                iconColor="text-green-600"
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
                iconColor="text-purple-600"
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
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                }
                label="This Week"
                value={userStats.recentActivity}
              />
            </section>
          )}
        </header>

        {/* Create URL Section */}
        <section aria-labelledby="create-url-heading" className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          <h2 id="create-url-heading" className="text-xl font-semibold text-gray-900 mb-6">
            Create New Short URL
          </h2>
          <UrlForm onUrlCreated={fetchMyUrls} user={user} />
        </section>

        {/* My URLs Section */}
        <section aria-labelledby="my-urls-heading" className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 id="my-urls-heading" className="text-xl font-semibold text-gray-900">My URLs</h2>
            <button
              onClick={fetchMyUrls}
              disabled={loading}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded px-2 py-1"
              aria-label={loading ? "Refreshing URL list" : "Refresh URL list"}
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {error && !loading && null /* Error handled in urlList */}

          {urlList}
        </section>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog {...confirmDialog} />
    </main>
  );
};

export default memo(Dashboard);
