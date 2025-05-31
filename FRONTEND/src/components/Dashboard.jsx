import { useState, useEffect } from "react";
import UrlForm from "../components/UrlForm";
import { getMyUrls, deleteShortUrl } from "../api/shortUrl.api";

const Dashboard = ({ user }) => {
  const [myUrls, setMyUrls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedUrl, setCopiedUrl] = useState(null);
  const [deletingUrl, setDeletingUrl] = useState(null);
  const [userStats, setUserStats] = useState({
    totalUrls: 0,
    totalClicks: 0,
    recentActivity: 0,
  });

  const fetchMyUrls = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getMyUrls();
      if (response && response.data && response.data.urls) {
        const urls = response.data.urls;
        setMyUrls(urls);

        // Calculate stats
        const totalClicks = urls.reduce(
          (sum, url) => sum + (url.click || 0),
          0
        );
        const recentUrls = urls.filter((url) => {
          const createdDate = new Date(url.createdAt);
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          return createdDate > sevenDaysAgo;
        });

        setUserStats({
          totalUrls: urls.length,
          totalClicks: totalClicks,
          recentActivity: recentUrls.length,
        });
      }
    } catch (err) {
      setError("Failed to fetch your URLs");
      console.error("Error fetching URLs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyUrls();
  }, []);

  const copyToClipboard = (url) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
    });
  };

  const handleDeleteUrl = async (urlId) => {
    if (!confirm("Are you sure you want to delete this URL?")) {
      return;
    }

    setDeletingUrl(urlId);
    try {
      await deleteShortUrl(urlId);
      // Refresh the list after successful deletion
      await fetchMyUrls();
    } catch (err) {
      setError("Failed to delete URL");
      console.error("Error deleting URL:", err);
    } finally {
      setDeletingUrl(null);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Enhanced Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center space-x-6 mb-6">
            <div className="relative">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-16 h-16 rounded-full shadow-lg"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "flex";
                }}
              />
              <div className="w-16 h-16 bg-blue-100 rounded-full items-center justify-center shadow-lg hidden">
                <span className="text-2xl font-bold text-blue-600">
                  {(user.name || user.email || "U").charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                Welcome back, {user.name || user.email}!
              </h1>
              <p className="text-gray-600 mb-3">
                Create and manage your short URLs
              </p>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>📧 {user.email}</span>
                <span>•</span>
                <span>
                  🗓️ Member since{" "}
                  {new Date(user.createdAt || Date.now()).toLocaleDateString(
                    "en-US",
                    { month: "short", year: "numeric" }
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Total URLs
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {userStats.totalUrls}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Total Clicks
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {userStats.totalClicks}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">This Week</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {userStats.recentActivity}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Create URL Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Create New Short URL
          </h2>
          <UrlForm onUrlCreated={fetchMyUrls} user={user} />
        </div>

        {/* My URLs Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">My URLs</h2>
            <button
              onClick={fetchMyUrls}
              disabled={loading}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm disabled:opacity-50">
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {myUrls.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl mx-auto mb-6 flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                No URLs yet
              </h3>
              <p className="text-gray-600 text-lg">
                Create your first short URL using the form above.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {myUrls.map((url) => (
                <div
                  key={url._id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <a
                          href={`http://localhost:3001/${url.short_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 font-medium">
                          localhost:3001/{url.short_url}
                        </a>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {url.click} clicks
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm truncate">
                        {url.full_url}
                      </p>
                      <div className="flex items-center space-x-4 mt-1">
                        <p className="text-gray-400 text-xs">
                          Created {new Date(url.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() =>
                          copyToClipboard(
                            `http://localhost:3001/${url.short_url}`
                          )
                        }
                        className={`p-2 transition-colors ${
                          copiedUrl === `http://localhost:3001/${url.short_url}`
                            ? "text-green-600"
                            : "text-gray-400 hover:text-gray-600"
                        }`}
                        title={
                          copiedUrl === `http://localhost:3001/${url.short_url}`
                            ? "Copied!"
                            : "Copy to clipboard"
                        }>
                        {copiedUrl ===
                        `http://localhost:3001/${url.short_url}` ? (
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24">
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
                            viewBox="0 0 24 24">
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
                        onClick={() => handleDeleteUrl(url._id)}
                        disabled={deletingUrl === url._id}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                        title="Delete URL">
                        {deletingUrl === url._id ? (
                          <div className="w-5 h-5 animate-spin rounded-full border-2 border-gray-300 border-t-red-600"></div>
                        ) : (
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24">
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
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
