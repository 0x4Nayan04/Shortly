import { useState } from "react";
import {
    AlertCircle,
    Check,
    Share2,
    User,
    Lock,
    Settings2,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import { BrandedSpinner } from "./LoadingSpinner";
import ShareModal from "./ShareModal";
import { createShortUrl, createCustomShortUrl } from "../api/shortUrl.api";
import {
    buildPublicShortUrl,
    getPublicShortBaseUrl,
} from "../utils/publicShortUrl";
import { validators } from "../utils/validation";
import { formAlertClass, formCompoundClass } from "../utils/designFormClasses";
import { useAnnouncement, LiveRegion } from "./Accessibility";
import {
    showToast,
    useOnlineStatus,
    useCopyToClipboard,
} from "./UxEnhancements";

const UrlForm = ({ onUrlCreated, user, onShowAuth, variant = "default" }) => {
    const isLanding = variant === "landing";
    const [url, setUrl] = useState("");
    const [customAlias, setCustomAlias] = useState("");
    const [shortUrl, setShortUrl] = useState("");
    const [createdLink, setCreatedLink] = useState(null);
    const [shareOpen, setShareOpen] = useState(false);
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
                return useCustomAlias
                    ? validators.customAlias(value, { required: true })
                    : null;
            default:
                return null;
        }
    };

    // Handle field blur - validate and mark as touched
    const handleBlur = (field, value) => {
        setTouched((prev) => ({ ...prev, [field]: true }));
        setFieldErrors((prev) => ({
            ...prev,
            [field]: validateField(field, value),
        }));
    };

    // Handle field change
    const handleChange = (field, value, setter) => {
        setter(value);
        // Clear server error when user starts typing
        if (error) setError("");

        // If field was touched, validate on change for immediate feedback
        if (touched[field]) {
            setFieldErrors((prev) => ({
                ...prev,
                [field]: validateField(field, value),
            }));
        }
    };

    // Validate all fields before submit
    const validateAllFields = () => {
        const errors = {
            url: validators.url(url),
            customAlias: useCustomAlias
                ? validators.customAlias(customAlias, { required: true })
                : null,
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
        setCreatedLink(null);
        setShareOpen(false);

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

            const createdShortUrl =
                response?.data?.short_url || response?.short_url;

            if (createdShortUrl) {
                setCreatedLink({ slug: createdShortUrl, fullUrl: url });
                setShortUrl(buildPublicShortUrl(createdShortUrl));
                showToast.dismiss(loadingToast);
                showToast.success("URL shortened successfully!");
                announce(
                    "URL shortened successfully! Your new short URL is ready.",
                );
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
            if (
                data &&
                typeof data === "object" &&
                Array.isArray(data.errors)
            ) {
                const backendErrors = {};
                data.errors.forEach((e) => {
                    const fieldName =
                        e.field === "full_url"
                            ? "url"
                            : e.field === "custom_url"
                              ? "customAlias"
                              : e.field;
                    backendErrors[fieldName] = e.message;
                });
                setFieldErrors((prev) => ({ ...prev, ...backendErrors }));
                showToast.error("Please check the form for errors.");
            } else {
                const errorMsg =
                    typeof data === "string"
                        ? data
                        : data?.message || "Failed to create short URL";
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

    const urlHasError = touched.url && fieldErrors.url;
    const aliasHasError = touched.customAlias && fieldErrors.customAlias;
    const compoundHasError = urlHasError || aliasHasError;

    return (
        <div className={isLanding ? "" : "space-y-6"}>
            {/* Live region for screen reader announcements */}
            <LiveRegion message={announcement} politeness="polite" />

            <form
                onSubmit={handleSubmit}
                className={isLanding ? "pt-0" : "space-y-4"}
                aria-label="URL shortener form"
            >
                {isLanding ? (
                    <>
                        <div
                            className={`hero-form-compound${compoundHasError ? " hero-form-compound-error" : ""}`}
                        >
                            <label htmlFor="url-input" className="sr-only">
                                Long URL
                            </label>
                            <div className="hero-cli-bar">
                                <span
                                    className="hero-cli-prefix"
                                    aria-hidden="true"
                                >
                                    url
                                </span>
                                <input
                                    id="url-input"
                                    type="url"
                                    value={url}
                                    onChange={(e) =>
                                        handleChange(
                                            "url",
                                            e.target.value,
                                            setUrl,
                                        )
                                    }
                                    onBlur={(e) =>
                                        handleBlur("url", e.target.value)
                                    }
                                    placeholder="https://example.com/your-long-link"
                                    className="hero-cli-input"
                                    aria-invalid={
                                        urlHasError ? "true" : "false"
                                    }
                                    aria-describedby={
                                        fieldErrors.url
                                            ? "url-error"
                                            : undefined
                                    }
                                    autoComplete="url"
                                />
                                <button
                                    type="submit"
                                    disabled={loading}
                                    aria-busy={loading}
                                    className="hero-cli-submit focus-ring"
                                >
                                    {loading ? (
                                        <BrandedSpinner size="sm" decorative />
                                    ) : (
                                        "Shorten"
                                    )}
                                </button>
                            </div>

                            {/* Progressive Customization Drawer */}
                            {!user ? (
                                <div className="catalog-row flex w-full items-center justify-between gap-2 px-4">
                                    <button
                                        type="button"
                                        onClick={onShowAuth}
                                        className="flex min-h-[var(--btn-h)] flex-1 items-center gap-1.5 border-0 bg-transparent text-sm font-medium text-muted-strong transition-colors hover:text-ink focus-ring active:scale-[0.99] duration-100"
                                    >
                                        <Settings2 size={15} /> Customize link{" "}
                                        <ChevronDown
                                            size={14}
                                            className="opacity-50"
                                        />
                                    </button>
                                    <span
                                        className="flex shrink-0 items-center gap-1 rounded bg-background-alt px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-strong cursor-default"
                                        title="Members only"
                                    >
                                        <Lock size={10} strokeWidth={2.5} />{" "}
                                        Members
                                    </span>
                                </div>
                            ) : (
                                <div className="flex flex-col">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const next = !useCustomAlias;
                                            setUseCustomAlias(next);
                                            setError("");
                                            if (!next) {
                                                setFieldErrors((prev) => ({
                                                    ...prev,
                                                    customAlias: null,
                                                }));
                                                setTouched((prev) => ({
                                                    ...prev,
                                                    customAlias: false,
                                                }));
                                            }
                                        }}
                                        className="catalog-row flex w-full items-center gap-1.5 border-0 border-t border-border bg-transparent px-4 text-sm font-medium text-muted-strong transition-colors hover:bg-[color-mix(in_srgb,var(--color-background-alt)_35%,white)] hover:text-ink focus-ring active:scale-[0.99] duration-100"
                                        aria-expanded={useCustomAlias}
                                    >
                                        <Settings2
                                            size={15}
                                            className={
                                                useCustomAlias
                                                    ? "text-primary"
                                                    : "text-muted"
                                            }
                                        />
                                        <span
                                            className={
                                                useCustomAlias
                                                    ? "text-ink"
                                                    : "text-muted-strong"
                                            }
                                        >
                                            Customize link
                                        </span>
                                        {useCustomAlias ? (
                                            <ChevronUp
                                                size={14}
                                                className="ml-auto opacity-60 text-muted-strong"
                                            />
                                        ) : (
                                            <ChevronDown
                                                size={14}
                                                className="ml-auto opacity-50"
                                            />
                                        )}
                                    </button>

                                    {useCustomAlias && (
                                        <div className="hero-alias-panel animate-in fade-in slide-in-from-top-1 duration-200">
                                            <div className="hero-alias-field">
                                                <label
                                                    htmlFor="custom-alias-input"
                                                    className="sr-only"
                                                >
                                                    Custom alias
                                                </label>
                                                <div className="hero-cli-bar hero-alias-bar">
                                                    <span
                                                        className="hero-cli-prefix shrink-0"
                                                        aria-hidden="true"
                                                    >
                                                        {getPublicShortBaseUrl()}
                                                        /
                                                    </span>
                                                    <input
                                                        id="custom-alias-input"
                                                        type="text"
                                                        value={customAlias}
                                                        onChange={(e) =>
                                                            handleChange(
                                                                "customAlias",
                                                                e.target.value,
                                                                setCustomAlias,
                                                            )
                                                        }
                                                        onBlur={(e) =>
                                                            handleBlur(
                                                                "customAlias",
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="my-link"
                                                        className="hero-cli-input font-mono text-sm"
                                                        aria-invalid={
                                                            touched.customAlias &&
                                                            fieldErrors.customAlias
                                                                ? "true"
                                                                : "false"
                                                        }
                                                        aria-describedby={
                                                            fieldErrors.customAlias
                                                                ? "customAlias-error"
                                                                : "customAlias-hint"
                                                        }
                                                        autoComplete="off"
                                                    />
                                                </div>
                                                {touched.customAlias &&
                                                fieldErrors.customAlias ? (
                                                    <p
                                                        id="customAlias-error"
                                                        className="hero-form-error hero-alias-footnote"
                                                        role="alert"
                                                    >
                                                        {
                                                            fieldErrors.customAlias
                                                        }
                                                    </p>
                                                ) : (
                                                    <p
                                                        id="customAlias-hint"
                                                        className="hero-form-hint hero-alias-footnote"
                                                    >
                                                        3–20 chars · letters,
                                                        numbers, hyphens,
                                                        underscores
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                            {urlHasError && (
                                <p
                                    id="url-error"
                                    className="hero-form-error"
                                    role="alert"
                                >
                                    {fieldErrors.url}
                                </p>
                            )}
                            {url &&
                                !fieldErrors.url &&
                                !loading &&
                                !shortUrl && (
                                    <p
                                        className="truncate px-4 pb-3 font-mono text-xs text-muted"
                                        title={url}
                                    >
                                        → {url}
                                    </p>
                                )}
                        </div>
                    </>
                ) : (
                    <div className="space-y-4">
                        <div className={formCompoundClass(urlHasError)}>
                            <label htmlFor="url-input" className="sr-only">
                                Enter your long URL
                            </label>
                            <div className="hero-cli-bar">
                                <input
                                    id="url-input"
                                    type="url"
                                    value={url}
                                    onChange={(e) =>
                                        handleChange(
                                            "url",
                                            e.target.value,
                                            setUrl,
                                        )
                                    }
                                    onBlur={(e) =>
                                        handleBlur("url", e.target.value)
                                    }
                                    placeholder="Enter your long URL here..."
                                    className="hero-cli-input"
                                    aria-invalid={
                                        urlHasError ? "true" : "false"
                                    }
                                    aria-describedby={
                                        fieldErrors.url
                                            ? "url-error"
                                            : undefined
                                    }
                                    autoComplete="url"
                                />
                                <button
                                    type="submit"
                                    disabled={loading}
                                    aria-busy={loading}
                                    className="hero-cli-submit"
                                >
                                    {loading ? (
                                        <BrandedSpinner size="sm" decorative />
                                    ) : (
                                        "Shorten"
                                    )}
                                </button>
                            </div>
                            {urlHasError && (
                                <p
                                    id="url-error"
                                    className="hero-form-error px-4 pb-3"
                                    role="alert"
                                >
                                    {fieldErrors.url}
                                </p>
                            )}
                            {url &&
                                !fieldErrors.url &&
                                !loading &&
                                !shortUrl && (
                                    <p
                                        className="truncate px-4 pb-3 font-mono text-xs text-muted"
                                        title={url}
                                    >
                                        <span aria-hidden="true">→ </span>
                                        {url}
                                    </p>
                                )}
                        </div>

                        <>
                            <div className="flex items-center gap-3">
                                <label
                                    htmlFor="custom-alias-checkbox"
                                    className={`flex items-center gap-3 ${!user ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                                >
                                    <input
                                        id="custom-alias-checkbox"
                                        type="checkbox"
                                        checked={useCustomAlias}
                                        disabled={!user}
                                        onChange={(e) => {
                                            if (!user && e.target.checked) {
                                                setError(
                                                    "Please sign in to use custom aliases",
                                                );
                                                if (onShowAuth) {
                                                    onShowAuth();
                                                }
                                                return;
                                            }
                                            setUseCustomAlias(e.target.checked);
                                            setError("");
                                            if (!e.target.checked) {
                                                setFieldErrors((prev) => ({
                                                    ...prev,
                                                    customAlias: null,
                                                }));
                                                setTouched((prev) => ({
                                                    ...prev,
                                                    customAlias: false,
                                                }));
                                            }
                                        }}
                                        className="h-4 w-4 shrink-0 min-w-0 min-h-0 accent-[var(--color-primary)] cursor-pointer disabled:opacity-50"
                                        aria-describedby="custom-alias-description"
                                    />
                                    <span
                                        className={`text-sm font-medium ${!user ? "text-muted" : "text-muted-strong"}`}
                                        id="custom-alias-description"
                                    >
                                        Use custom alias
                                        {!user && (
                                            <span className="ml-1 text-primary">
                                                (requires login)
                                            </span>
                                        )}
                                    </span>
                                </label>
                            </div>

                            {useCustomAlias && (
                                <div
                                    className={formCompoundClass(aliasHasError)}
                                >
                                    <div className="hero-alias-field">
                                        <label
                                            htmlFor="custom-alias-input"
                                            className="sr-only"
                                        >
                                            Custom alias
                                        </label>
                                        <div className="hero-cli-bar hero-alias-bar">
                                            <span
                                                className="hero-cli-prefix shrink-0"
                                                aria-hidden="true"
                                            >
                                                {getPublicShortBaseUrl()}/
                                            </span>
                                            <input
                                                id="custom-alias-input"
                                                type="text"
                                                value={customAlias}
                                                onChange={(e) =>
                                                    handleChange(
                                                        "customAlias",
                                                        e.target.value,
                                                        setCustomAlias,
                                                    )
                                                }
                                                onBlur={(e) =>
                                                    handleBlur(
                                                        "customAlias",
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="your-custom-alias"
                                                className="hero-cli-input font-mono text-sm"
                                                aria-invalid={
                                                    touched.customAlias &&
                                                    fieldErrors.customAlias
                                                        ? "true"
                                                        : "false"
                                                }
                                                aria-describedby={
                                                    fieldErrors.customAlias
                                                        ? "customAlias-error"
                                                        : "customAlias-hint"
                                                }
                                                autoComplete="off"
                                            />
                                        </div>
                                        {touched.customAlias &&
                                        fieldErrors.customAlias ? (
                                            <p
                                                id="customAlias-error"
                                                className="hero-form-error hero-alias-footnote"
                                                role="alert"
                                            >
                                                {fieldErrors.customAlias}
                                            </p>
                                        ) : (
                                            <p
                                                id="customAlias-hint"
                                                className="hero-form-hint hero-alias-footnote"
                                            >
                                                3–20 chars · letters, numbers,
                                                hyphens, underscores
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    </div>
                )}
                {error && (
                    <div
                        className={formAlertClass}
                        role="alert"
                        aria-live="assertive"
                    >
                        <div className="flex items-center">
                            <AlertCircle
                                className="w-5 h-5 mr-2 shrink-0"
                                aria-hidden="true"
                            />
                            {error}
                        </div>
                        <div className="mt-3 flex gap-2">
                            <button
                                type="button"
                                onClick={handleSubmit}
                                className="sm-btn sm-btn-primary text-sm !bg-[#dc2626] hover:!opacity-90"
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                )}
            </form>

            {shortUrl && (
                <div
                    className={
                        isLanding
                            ? "short-link-result short-link-result--landing animate-fade-in"
                            : "short-link-result app-panel animate-fade-in"
                    }
                    role="status"
                    aria-live="polite"
                >
                    <div className="short-link-result__header">
                        <div className="short-link-result__icon">
                            <Check className="w-4 h-4" aria-hidden="true" />
                        </div>
                        <div className="short-link-result__heading">
                            <p className="short-link-result__eyebrow">
                                Short link created
                            </p>
                            <h3 className="short-link-result__title">
                                {isLanding
                                    ? "Your short link is ready"
                                    : "URL shortened successfully!"}
                            </h3>
                        </div>
                    </div>

                    <div className="short-link-result__body">
                        <label
                            htmlFor="short-url-output"
                            className="short-link-result__label"
                        >
                            Your shortened URL
                        </label>
                        <div className="short-link-result__url-row">
                            <input
                                id="short-url-output"
                                type="text"
                                value={shortUrl}
                                readOnly
                                className="short-link-result__input sm-input"
                                aria-describedby="short-url-description"
                                onClick={(e) => e.target.select()}
                            />
                            <button
                                type="button"
                                onClick={copyToClipboard}
                                aria-label={
                                    isCopied(shortUrl)
                                        ? "URL copied to clipboard"
                                        : "Copy URL to clipboard"
                                }
                                className="short-link-result__copy sm-btn sm-btn-primary"
                            >
                                {isCopied(shortUrl) ? (
                                    <>
                                        <Check
                                            className="w-4 h-4"
                                            aria-hidden="true"
                                        />
                                        Copied
                                    </>
                                ) : (
                                    "Copy"
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShareOpen(true)}
                                className="short-link-result__share sm-btn sm-btn-secondary"
                                aria-label="Share shortened URL"
                            >
                                <Share2
                                    className="w-4 h-4"
                                    aria-hidden="true"
                                />
                                Share
                            </button>
                        </div>
                        <p
                            id="short-url-description"
                            className="short-link-result__description"
                        >
                            Copy your new shortened URL or share it using the
                            buttons above.
                        </p>
                    </div>

                    {!user && (
                        <div
                            className={
                                isLanding
                                    ? "mt-4 border-t border-border pt-4"
                                    : "mt-4 border-t border-border pt-4"
                            }
                        >
                            <div className="flex items-center gap-3">
                                {!isLanding && (
                                    <User
                                        className="h-5 w-5 shrink-0 text-primary"
                                        aria-hidden="true"
                                    />
                                )}
                                <p
                                    className={
                                        isLanding
                                            ? "text-sm text-muted-strong"
                                            : "text-sm text-muted-strong"
                                    }
                                >
                                    {isLanding ? (
                                        <>
                                            <span className="font-medium text-ink">
                                                Not saved
                                            </span>{" "}
                                            —{" "}
                                            <button
                                                type="button"
                                                onClick={onShowAuth}
                                                className="font-medium text-primary underline-offset-2 hover:underline focus:outline-none focus-visible:shadow-focus rounded-sm"
                                            >
                                                Sign up
                                            </button>{" "}
                                            to track clicks
                                        </>
                                    ) : (
                                        <>
                                            <strong className="text-ink">
                                                Not saved to your account.
                                            </strong>{" "}
                                            <button
                                                type="button"
                                                onClick={onShowAuth}
                                                className="landing-text-link font-medium"
                                            >
                                                Sign up free
                                            </button>{" "}
                                            to track clicks and manage your
                                            links.
                                        </>
                                    )}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <ShareModal
                isOpen={shareOpen}
                onClose={() => setShareOpen(false)}
                shortUrl={createdLink?.slug}
                fullUrl={createdLink?.fullUrl}
            />
        </div>
    );
};

export default UrlForm;
