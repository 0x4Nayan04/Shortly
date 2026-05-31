/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  memo,
  useContext,
  useEffect,
  useRef,
  useState
} from 'react';
import { showToast } from './toast';

const OnlineStatusContext = createContext({ isOnline: true });

export const OnlineStatusProvider = memo(({ children }) => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const previousOnlineRef = useRef(isOnline);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (!previousOnlineRef.current) {
        showToast.online();
      }
      previousOnlineRef.current = true;
    };

    const handleOffline = () => {
      setIsOnline(false);
      previousOnlineRef.current = false;
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (!navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <OnlineStatusContext.Provider value={{ isOnline }}>
      {children}
    </OnlineStatusContext.Provider>
  );
});

OnlineStatusProvider.displayName = 'OnlineStatusProvider';

export const useOnlineStatus = () => useContext(OnlineStatusContext);

export const OfflineBanner = memo(() => {
  const { isOnline } = useOnlineStatus();
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (isOnline) {
      setIsDismissed(false);
    }
  }, [isOnline]);

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
        <span className='flex-1 text-center'>
          You're offline. Changes will sync when you reconnect.
        </span>
        <button
          type='button'
          onClick={() => setIsDismissed(true)}
          className='shrink-0 flex items-center justify-center w-6 h-6 text-muted-strong hover:text-ink transition-colors'
          aria-label='Dismiss offline notice'>
          <svg
            className='w-4 h-4'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
            aria-hidden='true'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M6 18L18 6M6 6l12 12'
            />
          </svg>
        </button>
      </div>
    </div>
  );
});

OfflineBanner.displayName = 'OfflineBanner';
