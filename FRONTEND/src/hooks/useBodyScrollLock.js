import { useEffect } from 'react';

const scrollLockCount = { current: 0 };
let previousOverflow = null;

/** Ref-counted document scroll lock — safe when multiple overlays are open. */
export function useBodyScrollLock(isLocked) {
  useEffect(() => {
    if (!isLocked) return undefined;

    if (scrollLockCount.current === 0) {
      previousOverflow = {
        root: document.documentElement.style.overflow,
        body: document.body.style.overflow
      };
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    }
    scrollLockCount.current++;

    return () => {
      scrollLockCount.current = Math.max(0, scrollLockCount.current - 1);
      if (scrollLockCount.current === 0 && previousOverflow) {
        document.documentElement.style.overflow = previousOverflow.root;
        document.body.style.overflow = previousOverflow.body;
        previousOverflow = null;
      }
    };
  }, [isLocked]);
}
