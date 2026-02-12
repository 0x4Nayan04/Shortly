import { useState, useEffect } from "react";
import { createShortUrl, createCustomShortUrl } from "../api/shortUrl.api";
import { validators } from "../utils/validation";

const UrlForm = ({ onUrlCreated, user, onShowAuth }) => {
  const [url, setUrl] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [useCustomAlias, setUseCustomAlias] = useState(false);

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

    // Validate all fields
    if (!validateAllFields()) {
      return;
    }

    setLoading(true);
    setError("");
    setShortUrl("");
    setIsCopied(false);

    try {
      let response;

      if (useCustomAlias && customAlias) {
        if (!user) {
          setError("Please sign in to use custom aliases");
          return;
        }
        response = await createCustomShortUrl(url, customAlias);
      } else {
        response = await createShortUrl(url);
      }

      if (response && response.data && response.data.short_url) {
        setShortUrl(response.data.short_url);
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
        setError("Failed to process the server response.");
      }
    } catch (err) {
      const data = err?.response ? err.response.data : err;
      if (data && typeof data === "object" && Array.isArray(data.errors)) {
        const backendErrors = {};
        data.errors.forEach((e) => {
          const fieldName = e.field === "full_url" ? "url" : e.field === "custom_url" ? "customAlias" : e.field;
          backendErrors[fieldName] = e.message;
        });
        setFieldErrors((prev) => ({ ...prev, ...backendErrors }));
      } else {
        setError(
          typeof data === "string" ? data : (data?.message || "Failed to create short URL")
        );
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

  // Helper to get input class based on validation state
  const getInputClass = (field) => {
    const baseClass = "flex-1 px-4 py-3 border rounded-lg text-base focus:outline-none focus:ring-2 focus:border-transparent transition-all";
    const hasError = touched[field] && fieldErrors[field];

    if (hasError) {
      return `${baseClass} border-red-300 focus:ring-red-500`;
    }
    return `${baseClass} border-gray-300 focus:ring-blue-500`;
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex gap-3">
              <input
                type="url"
                value={url}
                onChange={(e) => handleChange("url", e.target.value, setUrl)}
                onBlur={(e) => handleBlur("url", e.target.value)}
                placeholder="Enter your long URL here..."
                className={getInputClass("url")}
                aria-invalid={touched.url && fieldErrors.url ? "true" : "false"}
                aria-describedby={fieldErrors.url ? "url-error" : undefined}
              />
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-medium rounded-lg text-base transition-colors whitespace-nowrap">
                {loading ? "Shortening..." : "Shorten"}
              </button>
            </div>
            {touched.url && fieldErrors.url && (
              <p id="url-error" className="text-sm text-red-600">
                {fieldErrors.url}
              </p>
            )}
          </div>

          {/* Custom Alias Option */}
          <div className="flex items-center space-x-3">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useCustomAlias}
                onChange={(e) => {
                  if (!user && e.target.checked) {
                    // User is not logged in, show login prompt
                    setError("Please sign in to use custom aliases");
                    if (onShowAuth) {
                      onShowAuth();
                    }
                    return;
                  }
                  setUseCustomAlias(e.target.checked);
                  setError(""); // Clear any existing errors
                  // Reset custom alias validation when toggling off
                  if (!e.target.checked) {
                    setFieldErrors((prev) => ({ ...prev, customAlias: null }));
                    setTouched((prev) => ({ ...prev, customAlias: false }));
                  }
                }}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                Use custom alias
                {!user && (
                  <span className="text-blue-600 ml-1">(requires login)</span>
                )}
              </span>
            </label>
          </div>

          {useCustomAlias && (
            <div className="space-y-1">
              <div className="flex gap-3 items-center">
                <span className="text-sm text-gray-500 whitespace-nowrap">
                  {import.meta.env.VITE_APP_URL}/
                </span>
                <input
                  type="text"
                  value={customAlias}
                  onChange={(e) => handleChange("customAlias", e.target.value, setCustomAlias)}
                  onBlur={(e) => handleBlur("customAlias", e.target.value)}
                  placeholder="your-custom-alias"
                  className={getInputClass("customAlias")}
                  aria-invalid={touched.customAlias && fieldErrors.customAlias ? "true" : "false"}
                  aria-describedby={fieldErrors.customAlias ? "customAlias-error" : "customAlias-hint"}
                />
              </div>
              {touched.customAlias && fieldErrors.customAlias ? (
                <p id="customAlias-error" className="text-sm text-red-600">
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
