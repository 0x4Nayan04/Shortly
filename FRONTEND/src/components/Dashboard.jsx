import { useState, useEffect } from "react";
import UrlForm from "../components/UrlForm";
import { getMyUrls } from "../api/shortUrl.api";

const Dashboard = ({ user }) => {
  const [myUrls, setMyUrls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedUrl, setCopiedUrl] = useState(null);

  const fetchMyUrls = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getMyUrls();
      if (response && response.data && response.data.urls) {
        setMyUrls(response.data.urls);
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

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.name || user.email}!
          </h1>
          <p className="text-gray-600">Create and manage your short URLs</p>
        </div>

        {/* Create URL Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Create New Short URL
          </h2>
          <UrlForm onUrlCreated={fetchMyUrls} />
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
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 text-gray-300 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No URLs yet
              </h3>
              <p className="text-gray-500">
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
                          href={`http://localhost:3000/${url.short_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 font-medium">
                          localhost:3000/{url.short_url}
                        </a>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {url.click} clicks
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm truncate">
                        {url.full_url}
                      </p>
                      <p className="text-gray-400 text-xs mt-1">
                        Created {new Date(url.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `http://localhost:3000/${url.short_url}`
                        )
                      }
                      className={`ml-4 p-2 transition-colors ${
                        copiedUrl === `http://localhost:3000/${url.short_url}`
                          ? "text-green-600"
                          : "text-gray-400 hover:text-gray-600"
                      }`}
                      title={
                        copiedUrl === `http://localhost:3000/${url.short_url}`
                          ? "Copied!"
                          : "Copy to clipboard"
                      }>
                      {copiedUrl ===
                      `http://localhost:3000/${url.short_url}` ? (
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
