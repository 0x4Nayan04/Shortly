import { useState, useEffect } from "react"; // Import useEffect
import { createShortUrl } from "../api/shortUrl.api";

const UrlForm = () => {
  const [url, setUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isCopied, setIsCopied] = useState(false); // New state for copy status
  const API_URL = "http://localhost:3000";

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!url) return;

    setLoading(true);
    setError("");
    setShortUrl("");
    setIsCopied(false); // Reset copied status on new submission

    try {
      const response = await createShortUrl(url);

      if (response && response.data && response.data.short_url) {
        setShortUrl(`${API_URL}/${response.data.short_url}`);
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
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter your long URL here..."
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-base focus:outline-none focus:border-blue-500 transition-colors"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 hover:cursor-pointer disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-medium rounded-lg text-base transition-colors">
          {loading ? "Shortening..." : "Shorten URL"}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {shortUrl && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="font-semibold text-gray-700 mb-3">Short URL:</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={shortUrl}
              readOnly
              className="flex-1 px-3 py-2 border border-gray-300 rounded bg-gray-50 text-sm"
            />
            <button
              onClick={copyToClipboard}
              disabled={isCopied} // Optionally disable button while in "Copied!" state
              className={`px-4 py-2 font-medium text-white rounded transition-colors
                ${
                  isCopied
                    ? "bg-green-400 cursor-default" // Lighter green and default cursor when copied
                    : "bg-green-600 hover:bg-green-700 hover:cursor-pointer"
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
