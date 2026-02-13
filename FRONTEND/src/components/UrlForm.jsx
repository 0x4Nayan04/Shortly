import { useState, useEffect } from "react";
import { createShortUrl, createCustomShortUrl } from "../api/shortUrl.api";
import { validators } from "../utils/validation";
import { useAnnouncement, LiveRegion } from "./Accessibility";
import { showToast, useOnlineStatus, useCopyToClipboard } from "./UxEnhancements";

const UrlForm = ({ onUrlCreated, user, onShowAuth }) => {
  const [url, setUrl] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [useCustomAlias, setUseCustomAlias] = useState(false);
  const [announcement, announce] = useAnnouncement();
  const { isOnline } = useOnlineStatus();
  const { copy, isCopied } = useCopyToClipboard();

  // Field-level validation errors
  const [fieldErrors, setFieldErrors] = useState({
    url: null,
    customAlias: null,
  });
  // Track which fields have been touched
  const [touched, setTouched] = useState({
    url: false,
    customAlias: false,
  });

  // Validate a single field
  const validateField = (field, value) => {
    switch (field) {
      case "url":
        return validators.url(value);
      case "customAlias":
        return useCustomAlias ? validators.customAlias(value, { required: true }) : null;
      default:
        return null;
    }
  };

  // Handle field blur - validate and mark as touched
  const handleBlur = (field, value) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setFieldErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
  };

  // Handle field change
  const handleChange = (field, value, setter) => {
    setter(value);
    // Clear server error when user starts typing
    if (error) setError("");

    // If field was touched, validate on change for immediate feedback
    if (touched[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
    }
  };

  // Validate all fields before submit
  const validateAllFields = () => {
    const errors = {
      url: validators.url(url),
      customAlias: useCustomAlias ? validators.customAlias(customAlias, { required: true }) : null,
    };
    setFieldErrors(errors);
    setTouched({ url: true, customAlias: useCustomAlias });

    return !errors.url && !errors.customAlias;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check online status
    if (!isOnline) {
      showToast.error("You're offline. Cannot create URL.");
      return;
    }

    // Validate all fields
    if (!validateAllFields()) {
      return;
    }

    setLoading(true);
    setError("");
    setShortUrl("");

    const loadingToast = showToast.loading("Creating short URL...");

    try {
      let response;

      if (useCustomAlias && customAlias) {
        if (!user) {
          showToast.dismiss(loadingToast);
          setError("Please sign in to use custom aliases");
          showToast.error("Please sign in to use custom aliases");
          return;
        }
        response = await createCustomShortUrl(url, customAlias);
      } else {
        response = await createShortUrl(url);
      }

      if (response && response.data && response.data.short_url) {
        setShortUrl(response.data.short_url);
        showToast.dismiss(loadingToast);
        showToast.success("URL shortened successfully!");
        announce("URL shortened successfully! Your new short URL is ready.");
        // Call the callback if provided (for dashboard refresh)
        if (onUrlCreated) {
          onUrlCreated();
        }
        // Clear the inputs
        setUrl("");
        setCustomAlias("");
        setUseCustomAlias(false);
        setFieldErrors({ url: null, customAlias: null });
        setTouched({ url: false, customAlias: false });
      } else {
        console.error("Unexpected response structure:", response);
        showToast.dismiss(loadingToast);
        showToast.error("Failed to process the server response.");
        setError("Failed to process the server response.");
      }
    } catch (err) {
      showToast.dismiss(loadingToast);
      const data = err?.response ? err.response.data : err;
      if (data && typeof data === "object" && Array.isArray(data.errors)) {
        const backendErrors = {};
        data.errors.forEach((e) => {
          const fieldName = e.field === "full_url" ? "url" : e.field === "custom_url" ? "customAlias" : e.field;
          backendErrors[fieldName] = e.message;
        });
        setFieldErrors((prev) => ({ ...prev, ...backendErrors }));
        showToast.error("Please check the form for errors.");
      } else {
        const errorMsg = typeof data === "string" ? data : (data?.message || "Failed to create short URL");
        setError(errorMsg);
        showToast.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    copy(shortUrl, "Short URL copied to clipboard!");
    announce("Short URL copied to clipboard");
  };

  // Helper to get input class based on validation state
  const getInputClass = (field) => {
    const baseClass = "flex-1 px-4 py-3 border rounded-lg text-base focus:outline-none focus-visible:ring-2 focus:border-transparent transition-all";
    const hasError = touched[field] && fieldErrors[field];

    if (hasError) {
      return `${baseClass} border-red-300 focus-visible:ring-red-500`;
    }
    return `${baseClass} border-gray-300 focus-visible:ring-blue-500`;
  };

  return (
    <div className="space-y-6">
      {/* Live region for screen reader announcements */}
      <LiveRegion message={announcement} politeness="polite" />
      
      <form onSubmit={handleSubmit} className="space-y-4" aria-label="URL shortener form">
        <div className="space-y-3">
          <div className="space-y-1">
            <label htmlFor="url-input" className="sr-only">Enter your long URL</label>
            <div className="flex gap-3">
              <input
                id="url-input"
                type="url"
                value={url}
                onChange={(e) => handleChange("url", e.target.value, setUrl)}
                onBlur={(e) => handleBlur("url", e.target.value)}
                placeholder="Enter your long URL here..."
                className={getInputClass("url")}
                aria-invalid={touched.url && fieldErrors.url ? "true" : "false"}
                aria-describedby={fieldErrors.url ? "url-error" : undefined}
                autoComplete="url"
              />
              <button
                type="submit"
                disabled={loading}
                aria-busy={loading}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-medium rounded-lg text-base transition-colors whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
                {loading ? "Shortening..." : "Shorten"}
              </button>
            </div>
            {touched.url && fieldErrors.url && (
              <p id="url-error" className="text-sm text-red-600" role="alert">
                {fieldErrors.url}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <label
              htmlFor="custom-alias-checkbox"
              className="flex items-center gap-3 cursor-pointer">
              <input
                id="custom-alias-checkbox"
                type="checkbox"
                checked={useCustomAlias}
                onChange={(e) => {
                  if (!user && e.target.checked) {
                    setError("Please sign in to use custom aliases");
                    if (onShowAuth) {
                      onShowAuth();
                    }
                    return;
                  }
                  setUseCustomAlias(e.target.checked);
                  setError("");
                  if (!e.target.checked) {
                    setFieldErrors((prev) => ({ ...prev, customAlias: null }));
                    setTouched((prev) => ({ ...prev, customAlias: false }));
                  }
                }}
                className="w-4 h-4 shrink-0 min-w-0 min-h-0 text-blue-600 border-gray-300 rounded focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                aria-describedby="custom-alias-description"
              />
              <span
                className="text-sm font-medium text-gray-700"
                id="custom-alias-description">
                Use custom alias
                {!user && (
                  <span className="text-blue-600 ml-1">(requires login)</span>
                )}
              </span>
            </label>
          </div>

          {useCustomAlias && (
            <div className="space-y-1">
              <label htmlFor="custom-alias-input" className="sr-only">Custom alias</label>
              <div className="flex gap-3 items-center">
                <span className="text-sm text-gray-500 whitespace-nowrap" aria-hidden="true">
                  {import.meta.env.VITE_APP_URL}/
                </span>
                <input
                  id="custom-alias-input"
                  type="text"
                  value={customAlias}
                  onChange={(e) => handleChange("customAlias", e.target.value, setCustomAlias)}
                  onBlur={(e) => handleBlur("customAlias", e.target.value)}
                  placeholder="your-custom-alias"
                  className={getInputClass("customAlias")}
                  aria-invalid={touched.customAlias && fieldErrors.customAlias ? "true" : "false"}
                  aria-describedby={fieldErrors.customAlias ? "customAlias-error" : "customAlias-hint"}
                  autoComplete="off"
                />
              </div>
              {touched.customAlias && fieldErrors.customAlias ? (
                <p id="customAlias-error" className="text-sm text-red-600" role="alert">
                  {fieldErrors.customAlias}
                </p>
              ) : (
                <p id="customAlias-hint" className="text-sm text-gray-500">
                  3-30 characters. Letters, numbers, hyphens, and underscores only.
                </p>
              )}
            </div>
          )}
        </div>
      </form>

      {error && (
        <div 
          className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-center">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true">
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
        <div 
          className="p-6 bg-green-50 border border-green-200 rounded-lg"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center mb-3">
            <svg
              className="w-5 h-5 text-green-600 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true">
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
            <label htmlFor="short-url-output" className="sr-only">Your shortened URL</label>
            <input
              id="short-url-output"
              type="text"
              value={shortUrl}
              readOnly
              className="flex-1 px-3 py-2 border border-green-300 rounded-lg bg-white text-sm font-mono focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
              aria-describedby="short-url-description"
            />
            <span id="short-url-description" className="sr-only">Your new shortened URL. Click copy to copy it to your clipboard.</span>
            <button
              onClick={copyToClipboard}
              aria-label={isCopied(shortUrl) ? "URL copied to clipboard" : "Copy URL to clipboard"}
              className={`px-4 py-2 font-medium rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 ${
                isCopied(shortUrl)
                  ? "bg-green-600 text-white"
                  : "bg-green-100 text-green-700 hover:bg-green-200"
              }`}>
              {isCopied(shortUrl) ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UrlForm;
