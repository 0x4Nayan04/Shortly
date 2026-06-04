import toast from 'react-hot-toast';

const OFFLINE_TOAST_ID = 'offline-toast';

const toastConfig = {
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

const offlineIcon = (
  <svg
    className="size-5 text-[#dc2626]"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
    />
  </svg>
);

const onlineIcon = (
  <svg
    className="size-5 text-primary"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.858 15.355-5.858 21.213 0"
    />
  </svg>
);

export const showToast = {
  success: (message, options = {}) =>
    toast.success(message, { ...toastConfig.success, ...options }),

  error: (message, options = {}) =>
    toast.error(message, { ...toastConfig.error, ...options }),

  loading: (message, options = {}) =>
    toast.loading(message, { ...toastConfig.loading, ...options }),

  dismiss: (toastId) => toast.dismiss(toastId),

  offline: () =>
    toast.error("You're offline. Some features may not work.", {
      id: OFFLINE_TOAST_ID,
      duration: Infinity,
      icon: offlineIcon
    }),

  online: () => {
    toast.dismiss(OFFLINE_TOAST_ID);
    toast.success("You're back online!", {
      duration: 3000,
      icon: onlineIcon
    });
  }
};

export { toastConfig };
