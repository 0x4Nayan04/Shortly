import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Check, Copy, Loader2, QrCode, Share2, X } from "lucide-react";
import QRCode from "qrcode";
import { buildPublicShortUrl } from "../utils/publicShortUrl";
import { showToast, useCopyToClipboard } from "./UxEnhancements";
import { WhatsAppBrandIcon, XBrandIcon } from "./ShareBrandIcons";

const ShareModal = memo(({ isOpen, onClose, shortUrl, fullUrl }) => {
    const dialogRef = useRef(null);
    const [downloading, setDownloading] = useState(false);
    const [qrDataUrl, setQrDataUrl] = useState("");
    const { copy, isCopied } = useCopyToClipboard();
    const shortUrlFull = shortUrl ? buildPublicShortUrl(shortUrl) : "";
    const copied = shortUrlFull ? isCopied(shortUrlFull) : false;

    useEffect(() => {
        if (shortUrlFull) {
            QRCode.toDataURL(shortUrlFull, {
                type: "image/png",
                margin: 1,
                width: 300,
                color: { dark: "#0b1015", light: "#ffffff" },
            })
                .then(setQrDataUrl)
                .catch(console.error);
        }
    }, [shortUrlFull]);

    useEffect(() => {
        if (isOpen) {
            dialogRef.current?.focus();
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === "Escape" && isOpen) onCloseRef.current?.();
        };
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [isOpen]);

    const handleCopy = useCallback(() => {
        copy(shortUrlFull, "Link copied to clipboard!");
    }, [copy, shortUrlFull]);

    const handleWebShare = useCallback(async () => {
        if (typeof navigator === "undefined" || !navigator.share) {
            showToast.error("Web Share not supported on this browser");
            return;
        }
        try {
            await navigator.share({
                title: "Shortly",
                text: "Check out this link",
                url: shortUrlFull,
            });
        } catch (err) {
            if (err.name !== "AbortError") {
                showToast.error("Share cancelled");
            }
        }
    }, [shortUrlFull]);

    const downloadQr = useCallback(async () => {
        setDownloading(true);
        try {
            const dataUrl = await QRCode.toDataURL(shortUrlFull, {
                type: "image/png",
                margin: 2,
                width: 400,
                color: { dark: "#0b1015", light: "#ffffff" },
            });
            const a = document.createElement("a");
            a.href = dataUrl;
            a.download = `qr-${shortUrl}.png`;
            a.click();
            showToast.success("QR code downloaded!");
        } catch {
            showToast.error("Failed to download QR code");
        } finally {
            setDownloading(false);
        }
    }, [shortUrl, shortUrlFull]);

    if (!isOpen) return null;

    const shareActions = [
        {
            label: "Web Share",
            icon: <Share2 className="h-5 w-5" aria-hidden="true" />,
            onClick: handleWebShare,
            hidden: typeof navigator === "undefined" || !navigator.share,
        },
        {
            label: "X",
            icon: <XBrandIcon className="h-5 w-5" />,
            circleClass:
                "text-ink hover:bg-[var(--color-surface-muted)] hover:border-border",
            onClick: () =>
                window.open(
                    `https://x.com/intent/tweet?text=${encodeURIComponent(shortUrlFull)}`,
                    "_blank",
                    "noopener",
                ),
        },
        {
            label: "WhatsApp",
            icon: <WhatsAppBrandIcon className="h-5 w-5" />,
            circleClass:
                "text-[#25D366] hover:bg-[var(--color-surface-muted)] hover:border-border",
            onClick: () =>
                window.open(
                    `https://wa.me/?text=${encodeURIComponent(shortUrlFull)}`,
                    "_blank",
                    "noopener",
                ),
        },
        {
            label: "Download QR",
            icon: downloading ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            ) : (
                <QrCode className="h-5 w-5" aria-hidden="true" />
            ),
            onClick: downloadQr,
        },
    ];

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-dialog-title"
        >
            <div
                className="absolute inset-0 bg-[color-mix(in_srgb,var(--color-ink)_45%,transparent)] backdrop-blur-sm"
                onClick={onClose}
                aria-hidden="true"
            />
            <div
                ref={dialogRef}
                tabIndex={-1}
                className="share-modal relative app-panel w-full max-w-[28rem] max-h-[90dvh] overflow-y-auto animate-scale-in p-5 sm:p-6"
            >
                <div className="share-modal__header flex items-center justify-between pb-4 mb-5 border-b border-border">
                    <div className="share-modal__title-wrap flex flex-col gap-1">
                        <h2
                            id="share-dialog-title"
                            className="share-modal__title font-display text-xl font-semibold text-ink m-0 leading-none tracking-tight"
                        >
                            Share this link
                        </h2>
                        <p className="text-sm text-muted m-0">
                            Scan the QR code or copy the link below.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="landing-icon-btn shrink-0 w-8 h-8 rounded-full border border-border bg-surface-muted text-muted-strong hover:text-ink hover:border-primary transition-colors flex items-center justify-center"
                        aria-label="Close"
                    >
                        <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                </div>

                <div className="flex flex-col gap-6">
                    {/* QR Code Section */}
                    <div className="flex flex-col items-center justify-center bg-surface-muted border border-border p-4 rounded-sm">
                        {qrDataUrl ? (
                            <div className="bg-white p-2 rounded-sm shadow-sm border border-border/50">
                                <img
                                    src={qrDataUrl}
                                    alt="QR Code"
                                    className="w-40 h-40 object-contain"
                                />
                            </div>
                        ) : (
                            <div className="w-40 h-40 flex items-center justify-center text-muted">
                                <Loader2 className="w-6 h-6 animate-spin" />
                            </div>
                        )}
                    </div>

                    {/* URLs Section */}
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label
                                className="text-sm font-medium text-ink"
                                htmlFor="share-modal-short-url"
                            >
                                Short URL
                            </label>
                            <div className="flex items-stretch shadow-sm">
                                <input
                                    id="share-modal-short-url"
                                    readOnly
                                    value={shortUrlFull}
                                    placeholder="Short URL unavailable"
                                    className="sm-input flex-1 font-mono text-sm border-r-0 rounded-r-none focus:z-10 relative bg-surface"
                                    onClick={(e) => e.target.select()}
                                    aria-label="Shortened URL"
                                />
                                <button
                                    type="button"
                                    onClick={handleCopy}
                                    disabled={!shortUrlFull}
                                    className={`flex items-center justify-center px-4 border border-border font-medium text-sm transition-colors rounded-l-none z-0 ${
                                        copied
                                            ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                                            : "bg-surface-muted text-ink hover:bg-background-alt hover:border-primary"
                                    }`}
                                    aria-label={
                                        copied
                                            ? "Copied to clipboard"
                                            : "Copy short URL"
                                    }
                                    title={
                                        copied ? "Copied!" : "Copy short URL"
                                    }
                                    aria-live="polite"
                                >
                                    {copied ? (
                                        <>
                                            <Check
                                                className="h-4 w-4 mr-1.5"
                                                aria-hidden="true"
                                            />
                                            Copied
                                        </>
                                    ) : (
                                        <>
                                            <Copy
                                                className="h-4 w-4 mr-1.5"
                                                aria-hidden="true"
                                            />
                                            Copy
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {fullUrl && (
                            <div className="flex items-start gap-3 p-3 bg-blue-tint/30 border border-border/60 rounded-sm">
                                <span
                                    className="text-xs font-semibold uppercase tracking-wider text-primary shrink-0 mt-0.5"
                                    aria-hidden="true"
                                >
                                    Dest
                                </span>
                                <p
                                    className="text-sm text-muted-strong break-all line-clamp-2 m-0 leading-relaxed"
                                    title={fullUrl}
                                >
                                    {fullUrl}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-4 gap-3 pt-5 border-t border-border">
                        {shareActions
                            .filter((a) => !a.hidden)
                            .map((action) => (
                                <button
                                    key={action.label}
                                    type="button"
                                    onClick={action.onClick}
                                    disabled={!shortUrlFull}
                                    className="group flex flex-col items-center gap-2 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                    aria-label={action.label}
                                >
                                    <div
                                        className={`flex items-center justify-center w-12 h-12 rounded-full border border-border bg-surface shadow-sm transition-all duration-200 group-hover:scale-105 group-hover:shadow-md group-focus-visible:ring-2 group-focus-visible:ring-primary group-focus-visible:ring-offset-2 ${
                                            action.circleClass ??
                                            "text-muted-strong group-hover:text-primary group-hover:border-primary group-hover:bg-blue-tint"
                                        }`}
                                    >
                                        {action.icon}
                                    </div>
                                    <span className="text-xs font-medium text-muted-strong group-hover:text-ink transition-colors text-center leading-tight">
                                        {action.label}
                                    </span>
                                </button>
                            ))}
                    </div>
                </div>
            </div>
        </div>
    );
});

ShareModal.displayName = "ShareModal";

export default ShareModal;
