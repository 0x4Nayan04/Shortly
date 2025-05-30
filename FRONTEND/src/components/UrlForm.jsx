import { useState, useEffect } from "react";
import { createShortUrl } from "../api/shortUrl.api";

const UrlForm = ({ onUrlCreated }) => {
  const [url, setUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!url) return;

    setLoading(true);
    setError("");
    setShortUrl("");
    setIsCopied(false);

    try {
      const response = await createShortUrl(url);

      if (response && response.data && response.data.short_url) {
        setShortUrl(response.data.short_url);
        // Call the callback if provided (for dashboard refresh)
        if (onUrlCreated) {
          onUrlCreated();
        }
        // Clear the input
        setUrl("");
      } else {
        console.error("Unexpected response structure:", response);
        setError("Failed to process the server response.");
      }
    } catch (err) {
      if (err.response) {
        setError(err.response.data.message || "Failed to create short URL");
      } else if (err.request) {
        setError("Network error. Please try again.");
      } else {
        console.error("An unexpected error occurred:", err);
        setError("An error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shortUrl);
    setIsCopied(true);
  };

  // Reset the "Copied!" status after a few seconds
  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => {
        setIsCopied(false);
      }, 2000); // Reset after 2 seconds
      return () => clearTimeout(timer); // Cleanup timer on component unmount or if isCopied changes
    }
  }, [isCopied]);

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-3">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter your long URL here..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-medium rounded-lg text-base transition-colors whitespace-nowrap">
            {loading ? "Shortening..." : "Shorten"}
          </button>
        </div>
      </form>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {error}
          </div>
        </div>
      )}

      {shortUrl && (
        <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center mb-3">
            <svg
              className="w-5 h-5 text-green-600 mr-2"
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
            <span className="font-medium text-green-800">
              URL shortened successfully!
            </span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={shortUrl}
              readOnly
              className="flex-1 px-3 py-2 border border-green-300 rounded-lg bg-white text-sm font-mono"
            />
            <button
              onClick={copyToClipboard}
              className={`px-4 py-2 font-medium rounded-lg transition-colors ${
                isCopied
                  ? "bg-green-600 text-white"
                  : "bg-green-100 text-green-700 hover:bg-green-200"
              }`}>
              {isCopied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UrlForm;
