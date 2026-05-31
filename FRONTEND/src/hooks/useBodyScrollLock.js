import { useEffect } from 'react';

const scrollLockCount = { current: 0 };

/** Ref-counted body scroll lock — safe when multiple overlays are open. */
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
