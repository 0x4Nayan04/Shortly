/**
 * UX Enhancement Components and Hooks
 * Provides toast notifications, offline detection, loading states, and error recovery
 */

/* eslint-disable react-refresh/only-export-components */
import {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
  useRef,
  memo
} from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Inbox, RotateCw } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// ============================================
// TOAST NOTIFICATION SYSTEM
// ============================================

/**
 * Custom toast configuration for consistent styling
 */
export const toastConfig = {
  style: {
    background: 'var(--color-surface)',
    color: 'var(--color-ink)',
    padding: '16px',
    borderRadius: '0',
    border: '1px solid var(--color-border)',
    boxShadow: 'var(--shadow-focus)',
    fontSize: '14px',
    maxWidth: 'min(400px, calc(100vw - 48px))'
  },
  success: {
    duration: 3000,
    iconTheme: {
      primary: 'var(--color-primary)',
      secondary: 'var(--color-surface)'
    }
  },
  error: {
    duration: 5000,
    iconTheme: {
      primary: '#dc2626',
      secondary: 'var(--color-surface)'
    }
  },
  loading: {
    duration: Infinity
  }
};

/**
 * Pre-configured toast functions for consistent UX
 */
export const OFFLINE_TOAST_ID = 'offline-toast';

export const showToast = {
  success: (message, options = {}) =>
    toast.success(message, { ...toastConfig.success, ...options }),

  error: (message, options = {}) =>
    toast.error(message, { ...toastConfig.error, ...options }),

  loading: (message, options = {}) =>
    toast.loading(message, { ...toastConfig.loading, ...options }),

  promise: (promise, messages, options = {}) =>
    toast.promise(promise, messages, options),

  dismiss: (toastId) => toast.dismiss(toastId),

  dismissAll: () => toast.dismiss(),

  // Custom toast with action button
  withAction: (message, actionLabel, onAction, options = {}) => {
    return toast(
      (t) => (
        <div className='flex items-center gap-3'>
          <span>{message}</span>
          <button
            onClick={() => {
              onAction();
              toast.dismiss(t.id);
            }}
            className='sm-btn sm-btn-secondary shrink-0 !h-8 !px-3 !text-sm'>
            {actionLabel}
          </button>
        </div>
      ),
      { duration: 5000, ...options }
    );
  },

  // Offline notification
  offline: () =>
    toast.error("You're offline. Some features may not work.", {
      id: OFFLINE_TOAST_ID,
      duration: Infinity,
      icon: (
        <svg
          className='w-5 h-5 text-[#dc2626]'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
          aria-hidden='true'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414'
          />
        </svg>
      )
    }),

  // Online notification
  online: () => {
    toast.dismiss(OFFLINE_TOAST_ID);
    toast.success("You're back online!", {
      duration: 3000,
      icon: (
        <svg
          className='w-5 h-5 text-primary'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
          aria-hidden='true'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.858 15.355-5.858 21.213 0'
          />
        </svg>
      )
    });
  }
};

/**
 * Toast Provider Component - Add this to your app root
 */
export const ToastProvider = memo(({ children }) => {
  return (
    <>
      {children}
      <Toaster
        position='bottom-right'
        gutter={16}
        containerStyle={{
          bottom: 24,
          right: 24
        }}
        toastOptions={{
          style: toastConfig.style,
          success: toastConfig.success,
          error: toastConfig.error,
          loading: toastConfig.loading
        }}
      />
    </>
  );
});

ToastProvider.displayName = 'ToastProvider';

// ============================================
// OFFLINE DETECTION
// ============================================

const OnlineStatusContext = createContext({
  isOnline: true,
  wasOffline: false
});

/**
 * Online Status Provider - Tracks network connectivity
 */
export const OnlineStatusProvider = memo(({ children }) => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState(false);
  const previousOnlineRef = useRef(isOnline);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (!previousOnlineRef.current) {
        setWasOffline(true);
        showToast.online();
        // Reset wasOffline after a short delay
        setTimeout(() => setWasOffline(false), 5000);
      }
      previousOnlineRef.current = true;
    };

    const handleOffline = () => {
      setIsOnline(false);
      previousOnlineRef.current = false;
      showToast.offline();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial status
    if (!navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <OnlineStatusContext.Provider value={{ isOnline, wasOffline }}>
      {children}
    </OnlineStatusContext.Provider>
  );
});

OnlineStatusProvider.displayName = 'OnlineStatusProvider';

/**
 * Hook to access online status
 */
export const useOnlineStatus = () => {
  const context = useContext(OnlineStatusContext);
  if (!context) {
    return { isOnline: true, wasOffline: false };
  }
  return context;
};

/**
 * Offline Banner Component
 */
export const OfflineBanner = memo(() => {
  const { isOnline } = useOnlineStatus();
  const [isDismissed, setIsDismissed] = useState(false);

  if (isOnline || isDismissed) return null;

  return (
    <div
      className='fixed bottom-0 left-0 right-0 border-t border-border bg-surface text-ink py-3 px-4 text-sm font-medium z-50 animate-slide-up'
      role='alert'
      aria-live='assertive'>
      <div className='flex items-center justify-center gap-2'>
        <svg
          className='w-5 h-5 shrink-0'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
          aria-hidden='true'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414'
          />
        </svg>
        <span className='flex-1 text-center'>You're offline. Changes will sync when you reconnect.</span>
        <button
          type='button'
          onClick={() => setIsDismissed(true)}
          className='shrink-0 flex items-center justify-center w-6 h-6 text-muted-strong hover:text-ink transition-colors'
          aria-label='Dismiss offline notice'>
          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
          </svg>
        </button>
      </div>
    </div>
  );
});

OfflineBanner.displayName = 'OfflineBanner';

// ============================================
// ENHANCED LOADING STATES
// ============================================

/**
 * Skeleton Loader - Animated placeholder for content
 */
export const Skeleton = memo(
  ({ className = '', variant = 'text', width, height }) => {
    const variantClasses = {
      text: 'h-4',
      title: 'h-6',
      avatar: 'rounded-full',
      card: '',
      button: 'h-10'
    };

    const style = {
      width: width || (variant === 'avatar' ? '40px' : '100%'),
      height: height || (variant === 'avatar' ? '40px' : undefined)
    };

    return (
      <div
        className={`sm-skeleton sm-skeleton--shimmer ${variantClasses[variant] || variantClasses.text} ${className}`}
        style={style}
        aria-hidden='true'
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

/**
 * Content Loader with fade-in animation
 */
export const ContentLoader = memo(
  ({ loading, children, skeleton, minHeight = '100px' }) => {
    const [showContent, setShowContent] = useState(!loading);

    useEffect(() => {
      if (!loading) {
        // Small delay for smooth transition
        const timer = setTimeout(() => setShowContent(true), 50);
        return () => clearTimeout(timer);
      }
      setShowContent(false);
    }, [loading]);

    if (loading) {
      return (
        <div
          style={{ minHeight }}
          aria-busy='true'
          aria-label='Loading content'>
          {skeleton}
        </div>
      );
    }

    return (
      <div
        className={`transition-opacity duration-300 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
        {children}
      </div>
    );
  }
);

ContentLoader.displayName = 'ContentLoader';

/**
 * Button with loading state
 */
export const LoadingButton = memo(
  ({ loading, disabled, children, loadingText, className = '', ...props }) => {
    return (
      <button
        disabled={loading || disabled}
        aria-busy={loading}
        className={`relative transition-all ${className} ${loading ? 'cursor-wait' : ''}`}
        {...props}>
        <span
          className={`flex items-center justify-center gap-2 ${loading ? 'opacity-0' : 'opacity-100'}`}>
          {children}
        </span>
        {loading && (
          <span className='absolute inset-0 flex items-center justify-center gap-2'>
            <span
              className='sm-spinner sm-spinner--sm'
              role='status'
              aria-hidden='true'
            />
            {loadingText && <span>{loadingText}</span>}
          </span>
        )}
      </button>
    );
  }
);

LoadingButton.displayName = 'LoadingButton';

/**
 * Pulse Dot Loader
 */
export const PulseLoader = memo(({ size = 'md', color = 'primary' }) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const colorClasses = {
    primary: 'bg-primary',
    muted: 'bg-muted',
    ink: 'bg-ink'
  };

  return (
    <div
      className='flex items-center gap-1'
      role='status'
      aria-label='Loading'>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`${sizeClasses[size]} ${colorClasses[color] || colorClasses.primary} rounded-full animate-pulse`}
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
      <span className='sr-only'>Loading...</span>
    </div>
  );
});

PulseLoader.displayName = 'PulseLoader';

// ============================================
// ERROR RECOVERY & RETRY
// ============================================

/**
 * Hook for retry logic with exponential backoff
 */
export const useRetry = (asyncFn, options = {}) => {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    onError,
    onRetry,
    onSuccess
  } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const abortControllerRef = useRef(null);

  const execute = useCallback(
    async (...args) => {
      setIsLoading(true);
      setError(null);

      let lastError = null;
      let currentRetry = 0;

      while (currentRetry <= maxRetries) {
        try {
          abortControllerRef.current = new AbortController();
          const result = await asyncFn(
            ...args,
            abortControllerRef.current.signal
          );
          setIsLoading(false);
          setRetryCount(0);
          onSuccess?.(result);
          return result;
        } catch (err) {
          if (err.name === 'AbortError') {
            setIsLoading(false);
            return;
          }

          lastError = err;
          currentRetry++;
          setRetryCount(currentRetry);

          if (currentRetry <= maxRetries) {
            const delay = initialDelay * Math.pow(2, currentRetry - 1);
            onRetry?.(currentRetry, delay);
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      }

      setError(lastError);
      setIsLoading(false);
      onError?.(lastError);
      throw lastError;
    },
    [asyncFn, maxRetries, initialDelay, onError, onRetry, onSuccess]
  );

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setRetryCount(0);
  }, []);

  return { execute, cancel, reset, isLoading, error, retryCount };
};

/**
 * Error Recovery Component with retry option
 */
export const ErrorRecovery = memo(
  ({
    error,
    onRetry,
    retryCount = 0,
    maxRetries = 3,
    title = 'Something went wrong',
    description
  }) => {
    const canRetry = retryCount < maxRetries;

    return (
      <div
        className='bg-surface border border-border text-center p-8'
        style={{ boxShadow: 'rgba(11,16,21,0.06) 0px 1px 0px 0px, rgba(11,16,21,0.18) 0px 6px 16px -10px', backgroundImage: 'var(--grad-dot)', backgroundSize: '24px 24px' }}
        role='alert'>
        <div className='w-12 h-12 mx-auto mb-5 rounded-full flex items-center justify-center'
          style={{ backgroundColor: 'color-mix(in srgb, var(--color-error) 10%, var(--color-surface))', borderColor: 'color-mix(in srgb, var(--color-error) 30%, var(--color-border))' }}>
          <AlertTriangle
            className='w-6 h-6 text-error'
            aria-hidden='true'
          />
        </div>

        <h3 className='font-display text-lg font-medium text-ink mb-2'>{title}</h3>
        <p className='text-sm text-muted leading-relaxed mb-6 max-w-sm mx-auto'>
          {description ||
            error?.message ||
            'An unexpected error occurred. Please try again.'}
        </p>

        {canRetry && onRetry && (
          <button
            onClick={onRetry}
            className='inline-flex items-center gap-2 px-4 py-2 bg-error text-white text-sm font-medium border border-error transition-all duration-150 hover:opacity-90'>
            <RotateCw className='w-3.5 h-3.5' />
            Try Again {retryCount > 0 && `(${retryCount}/${maxRetries})`}
          </button>
        )}

        {!canRetry && (
          <p className='text-sm text-error'>
            Maximum retry attempts reached. Please refresh the page or contact
            support.
          </p>
        )}
      </div>
    );
  }
);

ErrorRecovery.displayName = 'ErrorRecovery';

// ============================================
// EMPTY STATES
// ============================================

/**
 * Empty State Component
 */
export const EmptyState = memo(
  ({
    icon,
    title,
    description,
    action,
    actionLabel,
    variant = 'default' // default, muted, illustrated
  }) => {
    const variantStyles = {
      default: 'bg-surface border border-border',
      muted: 'bg-[var(--color-surface-muted)] border border-border',
      illustrated: 'bg-[var(--color-blue-tint)] border border-border'
    };

    const defaultIcon = (
      <Inbox
        className='w-12 h-12 text-muted'
        strokeWidth={1.5}
        aria-hidden='true'
      />
    );

    return (
      <div className={`text-center py-12 px-6 ${variantStyles[variant]}`}>
        <div className='w-20 h-20 bg-[var(--color-surface-muted)] border border-border mx-auto mb-6 flex items-center justify-center'>
          {icon || defaultIcon}
        </div>

        <h3 className='text-xl font-semibold text-ink mb-2'>{title}</h3>

        {description && (
          <p className='text-muted-strong mb-6 max-w-sm mx-auto'>
            {description}
          </p>
        )}

        {action && actionLabel && (
          <button
            onClick={action}
            className='sm-btn sm-btn-primary'>
            {actionLabel}
          </button>
        )}
      </div>
    );
  }
);

EmptyState.displayName = 'EmptyState';

// ============================================
// CONFIRMATION DIALOG
// ============================================

/**
 * Confirmation Dialog Hook
 */
export const useConfirmDialog = () => {
  const [state, setState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    variant: 'default', // default, danger
    onConfirm: null,
    onCancel: null
  });

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      setState({
        isOpen: true,
        title: options.title || 'Confirm Action',
        message: options.message || 'Are you sure you want to proceed?',
        confirmLabel: options.confirmLabel || 'Confirm',
        cancelLabel: options.cancelLabel || 'Cancel',
        variant: options.variant || 'default',
        onConfirm: () => {
          setState((s) => ({ ...s, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setState((s) => ({ ...s, isOpen: false }));
          resolve(false);
        }
      });
    });
  }, []);

  const close = useCallback(() => {
    setState((s) => ({ ...s, isOpen: false }));
  }, []);

  return { ...state, confirm, close };
};

/**
 * Confirmation Dialog Component
 */

const scrollLockCount = { current: 0 };

export function useBodyScrollLock(isLocked) {
  useEffect(() => {
    if (isLocked) {
      scrollLockCount.current++;
      document.body.style.overflow = 'hidden';
    } else {
      scrollLockCount.current = Math.max(0, scrollLockCount.current - 1);
    }
    if (scrollLockCount.current <= 0) {
      document.body.style.overflow = '';
    }
    return () => {
      scrollLockCount.current = Math.max(0, scrollLockCount.current - 1);
      if (scrollLockCount.current <= 0) {
        document.body.style.overflow = '';
      }
    };
  }, [isLocked]);
}

export const ConfirmDialog = memo(
  ({
    isOpen,
    title,
    message,
    confirmLabel,
    cancelLabel,
    variant,
    onConfirm,
    onCancel
  }) => {
    const dialogRef = useRef(null);

    useBodyScrollLock(isOpen);

    useEffect(() => {
      if (isOpen) {
        dialogRef.current?.focus();
      }
    }, [isOpen]);

    const onCancelRef = useRef(onCancel);
    onCancelRef.current = onCancel;

    useEffect(() => {
      const handleEscape = (e) => {
        if (e.key === 'Escape' && isOpen) {
          onCancelRef.current?.();
        }
      };
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen]);

    if (!isOpen) return null;

    const confirmButtonClasses =
      variant === 'danger'
        ? 'sm-btn bg-[#dc2626] text-white hover:opacity-90'
        : 'sm-btn sm-btn-primary';

    const overlay = (
      <div
        className='confirm-dialog-overlay fixed inset-0 z-[100] flex items-center justify-center p-4'
        role='dialog'
        aria-modal='true'
        aria-labelledby='confirm-dialog-title'>
        {/* Backdrop */}
        <div
          className='absolute inset-0 bg-[color-mix(in_srgb,var(--color-ink)_45%,transparent)] backdrop-blur-sm'
          onClick={onCancel}
          aria-hidden='true'
        />

        {/* Dialog */}
        <div
          ref={dialogRef}
          tabIndex={-1}
          className='relative app-panel max-w-md w-full animate-scale-in'>
          <h2
            id='confirm-dialog-title'
            className='text-lg font-semibold text-ink mb-2'>
            {title}
          </h2>
          <p className='text-muted-strong mb-6'>{message}</p>

          <div className='flex gap-3 justify-end'>
            <button
              onClick={onCancel}
              className='sm-btn sm-btn-secondary'>
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className={confirmButtonClasses}>
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    );

    return createPortal(overlay, document.body);
  }
);

ConfirmDialog.displayName = 'ConfirmDialog';

// ============================================
// PROGRESS INDICATOR
// ============================================

/**
 * Progress Bar Component
 */
export const ProgressBar = memo(
  ({ progress, showLabel = true, size = 'md', color = 'primary' }) => {
    const sizeClasses = {
      sm: 'h-1',
      md: 'h-2',
      lg: 'h-3'
    };

    const colorClasses = {
      primary: 'bg-primary',
      secondary: 'bg-secondary',
      muted: 'bg-muted-strong'
    };

    const clampedProgress = Math.min(100, Math.max(0, progress));

    return (
      <div className='w-full'>
        <div
          className={`w-full bg-border overflow-hidden ${sizeClasses[size]}`}>
          <div
            className={`${colorClasses[color] || colorClasses.primary} ${sizeClasses[size]} transition-all duration-300 ease-out`}
            style={{ width: `${clampedProgress}%` }}
            role='progressbar'
            aria-valuenow={clampedProgress}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
        {showLabel && (
          <p className='text-xs text-muted mt-1 text-right'>
            {Math.round(clampedProgress)}%
          </p>
        )}
      </div>
    );
  }
);

ProgressBar.displayName = 'ProgressBar';

// ============================================
// COPY TO CLIPBOARD WITH FEEDBACK
// ============================================

/**
 * Hook for copy to clipboard with toast feedback
 */
export const useCopyToClipboard = () => {
  const [copiedText, setCopiedText] = useState(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const copy = useCallback(
    async (text, successMessage = 'Copied to clipboard!') => {
      if (!navigator?.clipboard) {
        showToast.error('Clipboard not supported');
        return false;
      }

      try {
        await navigator.clipboard.writeText(text);
        setCopiedText(text);
        showToast.success(successMessage);

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setCopiedText(null), 2000);
        return true;
      } catch {
        showToast.error('Failed to copy');
        return false;
      }
    },
    []
  );

  return { copiedText, copy, isCopied: (text) => copiedText === text };
};

// ============================================
// UNSAVED CHANGES WARNING
// ============================================

/**
 * Hook to warn users about unsaved changes on page refresh/close
 */
export const useUnsavedChanges = (hasUnsavedChanges) => {
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);
};
