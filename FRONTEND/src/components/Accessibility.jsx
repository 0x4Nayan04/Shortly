/* eslint-disable react-refresh/only-export-components */
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState
} from 'react';

export const SkipLink = ({
  targetId = 'main-content',
  children = 'Skip to main content'
}) => {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] sm-btn sm-btn-primary focus-ring"
    >
      {children}
    </a>
  );
};

export const LiveRegion = ({
  message,
  politeness = 'polite',
  atomic = true
}) => {
  return (
    <output aria-live={politeness} aria-atomic={atomic} className="sr-only">
      {message}
    </output>
  );
};

export const useAnnouncement = () => {
  const [announcement, setAnnouncement] = useState('');
  const timeoutRef = useRef(null);

  const announce = useCallback((message, delay = 100) => {
    setAnnouncement('');
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setAnnouncement(message), delay);
  }, []);

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    []
  );

  return [announcement, announce];
};

export const useFocusTrap = (isActive, options = {}) => {
  const containerRef = useRef(null);
  const previousFocusRef = useRef(null);
  const onEscapeRef = useRef(null);

  const { onEscape, restoreFocus = true } = options;

  useLayoutEffect(() => {
    onEscapeRef.current = onEscape;
  }, [onEscape]);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const shouldRestoreFocus = restoreFocus;
    previousFocusRef.current = document.activeElement;

    const container = containerRef.current;
    const getFocusableElements = () =>
      [
        ...container.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ].filter(
        (element) =>
          !element.matches(':disabled, [tabindex="-1"]') &&
          !element.closest('[hidden], [inert]') &&
          getComputedStyle(element).display !== 'none' &&
          getComputedStyle(element).visibility !== 'hidden'
      );
    const focusableElements = getFocusableElements();
    const firstFocusable = focusableElements[0];

    if (firstFocusable && typeof firstFocusable.focus === 'function') {
      firstFocusable.focus();
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onEscapeRef.current) {
        onEscapeRef.current();
        return;
      }

      if (e.key !== 'Tab') return;

      const currentElements = getFocusableElements();
      const firstFocusable = currentElements[0];
      const lastFocusable = currentElements[currentElements.length - 1];
      if (!firstFocusable) {
        e.preventDefault();
        return;
      }

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable?.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      if (shouldRestoreFocus && previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [isActive, restoreFocus]);

  return containerRef;
};
