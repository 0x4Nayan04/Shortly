import { useState } from "react";

const TopPerformingUrls = ({ urls }) => {
  const [copiedUrl, setCopiedUrl] = useState(null);

  const copyToClipboard = (url) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
    });
  };

  const truncateUrl = (url, maxLength = 30) => {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + "...";
  };

  if (!urls || urls.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <svg
          className="w-12 h-12 mx-auto mb-4 text-gray-300"
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
        <p>No URLs created yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {urls.map((url, index) => (
        <div
          key={url.id}
          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-blue-600">
                #{index + 1}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {url.title || truncateUrl(url.fullUrl)}
                </p>
                <button
                  onClick={() => copyToClipboard(url.shortUrl)}
                  className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Copy short URL">
                  {copiedUrl === url.shortUrl ? (
                    <svg
                      className="w-4 h-4 text-green-500"
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
                      className="w-4 h-4"
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
              <p className="text-xs text-gray-500 truncate">{url.shortUrl}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4 flex-shrink-0">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">
                {url.clicks.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">clicks</p>
            </div>
            <div className="w-16 bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(
                    (url.clicks / Math.max(...urls.map((u) => u.clicks))) * 100,
                    100
                  )}%`,
                }}></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TopPerformingUrls;
