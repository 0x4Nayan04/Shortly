/**
 * UX Enhancement Components and Hooks
 * Provides toast notifications, offline detection, loading states, and error recovery
 */

import { useState, useEffect, useCallback, createContext, useContext, useRef, memo } from 'react';
import toast, { Toaster, useToasterStore } from 'react-hot-toast';

// ============================================
// TOAST NOTIFICATION SYSTEM
// ============================================

/**
 * Custom toast configuration for consistent styling
 */
export const toastConfig = {
  // Base styles for all toasts
  style: {
    background: '#fff',
    color: '#1f2937',
    padding: '16px',
    borderRadius: '12px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.12)',
    fontSize: '14px',
    maxWidth: '400px',
  },
  // Success toast
  success: {
    duration: 3000,
    iconTheme: {
      primary: '#10b981',
      secondary: '#fff',
    },
  },
  // Error toast
  error: {
    duration: 5000,
    iconTheme: {
      primary: '#ef4444',
      secondary: '#fff',
    },
  },
  // Loading toast
  loading: {
    duration: Infinity,
  },
};

/**
 * Pre-configured toast functions for consistent UX
 */
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
        <div className="flex items-center gap-3">
          <span>{message}</span>
          <button
            onClick={() => {
              onAction();
              toast.dismiss(t.id);
            }}
            className="px-3 py-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            {actionLabel}
          </button>
        </div>
      ),
      { duration: 5000, ...options }
    );
  },

  // Offline notification
  offline: () => 
    toast.error(
      "You're offline. Some features may not work.",
      { 
        id: 'offline-toast',
        duration: Infinity,
        icon: '📡',
      }
    ),

  // Online notification  
  online: () => {
    toast.dismiss('offline-toast');
    toast.success("You're back online!", { duration: 3000, icon: '🌐' });
  },
};

/**
 * Toast Provider Component - Add this to your app root
 */
export const ToastProvider = memo(({ children }) => {
  return (
    <>
      {children}
      <Toaster
        position="bottom-right"
        gutter={16}
        containerStyle={{
          bottom: 24,
          right: 24,
        }}
        toastOptions={{
          style: toastConfig.style,
          success: toastConfig.success,
          error: toastConfig.error,
          loading: toastConfig.loading,
        }}
      />
    </>
  );
});

ToastProvider.displayName = 'ToastProvider';

// ============================================
// OFFLINE DETECTION
// ============================================

const OnlineStatusContext = createContext({ isOnline: true, wasOffline: false });

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
  
  if (isOnline) return null;

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 bg-amber-500 text-amber-900 py-3 px-4 text-center text-sm font-medium z-50 animate-slide-up"
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-center justify-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
        </svg>
        <span>You're offline. Changes will sync when you reconnect.</span>
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
export const Skeleton = memo(({ className = '', variant = 'text', width, height }) => {
  const baseClasses = 'animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]';
  
  const variantClasses = {
    text: 'h-4 rounded',
    title: 'h-6 rounded',
    avatar: 'rounded-full',
    card: 'rounded-xl',
    button: 'h-10 rounded-lg',
  };

  const style = {
    width: width || (variant === 'avatar' ? '40px' : '100%'),
    height: height || (variant === 'avatar' ? '40px' : undefined),
  };

  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant] || variantClasses.text} ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
});

Skeleton.displayName = 'Skeleton';

/**
 * Content Loader with fade-in animation
 */
export const ContentLoader = memo(({ loading, children, skeleton, minHeight = '100px' }) => {
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
      <div style={{ minHeight }} aria-busy="true" aria-label="Loading content">
        {skeleton}
      </div>
    );
  }

  return (
    <div className={`transition-opacity duration-300 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
      {children}
    </div>
  );
});

ContentLoader.displayName = 'ContentLoader';

/**
 * Button with loading state
 */
export const LoadingButton = memo(({ 
  loading, 
  disabled, 
  children, 
  loadingText,
  className = '',
  ...props 
}) => {
  return (
    <button
      disabled={loading || disabled}
      aria-busy={loading}
      className={`relative transition-all ${className} ${loading ? 'cursor-wait' : ''}`}
      {...props}
    >
      <span className={`flex items-center justify-center gap-2 ${loading ? 'opacity-0' : 'opacity-100'}`}>
        {children}
      </span>
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center gap-2">
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {loadingText && <span>{loadingText}</span>}
        </span>
      )}
    </button>
  );
});

LoadingButton.displayName = 'LoadingButton';

/**
 * Pulse Dot Loader
 */
export const PulseLoader = memo(({ size = 'md', color = 'indigo' }) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const colorClasses = {
    indigo: 'bg-indigo-600',
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    gray: 'bg-gray-600',
  };

  return (
    <div className="flex items-center gap-1" role="status" aria-label="Loading">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full animate-pulse`}
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
      <span className="sr-only">Loading...</span>
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
    onSuccess,
  } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const abortControllerRef = useRef(null);

  const execute = useCallback(async (...args) => {
    setIsLoading(true);
    setError(null);
    
    let lastError = null;
    let currentRetry = 0;

    while (currentRetry <= maxRetries) {
      try {
        abortControllerRef.current = new AbortController();
        const result = await asyncFn(...args, abortControllerRef.current.signal);
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
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    setError(lastError);
    setIsLoading(false);
    onError?.(lastError);
    throw lastError;
  }, [asyncFn, maxRetries, initialDelay, onError, onRetry, onSuccess]);

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
export const ErrorRecovery = memo(({ 
  error, 
  onRetry, 
  retryCount = 0, 
  maxRetries = 3,
  title = "Something went wrong",
  description,
}) => {
  const canRetry = retryCount < maxRetries;

  return (
    <div 
      className="p-6 bg-red-50 border border-red-100 rounded-xl text-center"
      role="alert"
    >
      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      
      <h3 className="text-lg font-semibold text-red-800 mb-2">{title}</h3>
      <p className="text-sm text-red-600 mb-4">
        {description || error?.message || "An unexpected error occurred. Please try again."}
      </p>
      
      {canRetry && onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Try Again {retryCount > 0 && `(${retryCount}/${maxRetries})`}
        </button>
      )}
      
      {!canRetry && (
        <p className="text-sm text-red-500">
          Maximum retry attempts reached. Please refresh the page or contact support.
        </p>
      )}
    </div>
  );
});

ErrorRecovery.displayName = 'ErrorRecovery';

// ============================================
// EMPTY STATES
// ============================================

/**
 * Empty State Component
 */
export const EmptyState = memo(({ 
  icon,
  title, 
  description, 
  action,
  actionLabel,
  variant = 'default' // default, muted, illustrated
}) => {
  const variantStyles = {
    default: 'bg-white',
    muted: 'bg-gray-50',
    illustrated: 'bg-gradient-to-br from-indigo-50 to-purple-50',
  };

  const defaultIcon = (
    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  );

  return (
    <div className={`text-center py-12 px-6 rounded-xl ${variantStyles[variant]}`}>
      <div className="w-20 h-20 bg-gray-100 rounded-2xl mx-auto mb-6 flex items-center justify-center">
        {icon || defaultIcon}
      </div>
      
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      
      {description && (
        <p className="text-gray-600 mb-6 max-w-sm mx-auto">{description}</p>
      )}
      
      {action && actionLabel && (
        <button
          onClick={action}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
});

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
    onCancel: null,
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
          setState(s => ({ ...s, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setState(s => ({ ...s, isOpen: false }));
          resolve(false);
        },
      });
    });
  }, []);

  const close = useCallback(() => {
    setState(s => ({ ...s, isOpen: false }));
  }, []);

  return { ...state, confirm, close };
};

/**
 * Confirmation Dialog Component
 */
export const ConfirmDialog = memo(({ 
  isOpen, 
  title, 
  message, 
  confirmLabel, 
  cancelLabel, 
  variant,
  onConfirm, 
  onCancel,
}) => {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.focus();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel?.();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const confirmButtonClasses = variant === 'danger'
    ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
    : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />
      
      {/* Dialog */}
      <div 
        ref={dialogRef}
        tabIndex={-1}
        className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-scale-in"
      >
        <h2 id="confirm-dialog-title" className="text-lg font-semibold text-gray-900 mb-2">
          {title}
        </h2>
        <p className="text-gray-600 mb-6">{message}</p>
        
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${confirmButtonClasses}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
});

ConfirmDialog.displayName = 'ConfirmDialog';

// ============================================
// PROGRESS INDICATOR
// ============================================

/**
 * Progress Bar Component
 */
export const ProgressBar = memo(({ progress, showLabel = true, size = 'md', color = 'indigo' }) => {
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const colorClasses = {
    indigo: 'bg-indigo-600',
    blue: 'bg-blue-600',
    green: 'bg-green-600',
  };

  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className="w-full">
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className={`${colorClasses[color]} ${sizeClasses[size]} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${clampedProgress}%` }}
          role="progressbar"
          aria-valuenow={clampedProgress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      {showLabel && (
        <p className="text-xs text-gray-500 mt-1 text-right">{Math.round(clampedProgress)}%</p>
      )}
    </div>
  );
});

ProgressBar.displayName = 'ProgressBar';

// ============================================
// COPY TO CLIPBOARD WITH FEEDBACK
// ============================================

/**
 * Hook for copy to clipboard with toast feedback
 */
export const useCopyToClipboard = () => {
  const [copiedText, setCopiedText] = useState(null);

  const copy = useCallback(async (text, successMessage = 'Copied to clipboard!') => {
    if (!navigator?.clipboard) {
      showToast.error('Clipboard not supported');
      return false;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      showToast.success(successMessage);
      
      // Reset after 2 seconds
      setTimeout(() => setCopiedText(null), 2000);
      return true;
    } catch (err) {
      showToast.error('Failed to copy');
      return false;
    }
  }, []);

  return { copiedText, copy, isCopied: (text) => copiedText === text };
};
