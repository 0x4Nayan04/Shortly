/* eslint-disable react-refresh/only-export-components */
import { useEffect, useRef, useCallback, useState } from 'react';

export const SkipLink = ({
  targetId = 'main-content',
  children = 'Skip to main content'
}) => {
  return (
    <a
      href={`#${targetId}`}
      className='sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] sm-btn sm-btn-primary focus-ring'>
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
    <div
      role='status'
      aria-live={politeness}
      aria-atomic={atomic}
      className='sr-only'>
      {message}
    </div>
  );
};

export const useAnnouncement = () => {
  const [announcement, setAnnouncement] = useState('');

  const announce = useCallback((message, delay = 100) => {
    setAnnouncement('');
    setTimeout(() => setAnnouncement(message), delay);
  }, []);

  return [announcement, announce];
};

export const useFocusTrap = (isActive, options = {}) => {
  const containerRef = useRef(null);
  const previousFocusRef = useRef(null);
  const onEscapeRef = useRef(null);
  const restoreFocusRef = useRef(true);

  const { onEscape, restoreFocus = true } = options;
  onEscapeRef.current = onEscape;
  restoreFocusRef.current = restoreFocus;

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    previousFocusRef.current = document.activeElement;

    const container = containerRef.current;
    let focusableElements;
    try {
      focusableElements = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
    } catch {
      return;
    }
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    if (firstFocusable && typeof firstFocusable.focus === 'function') {
      firstFocusable.focus();
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onEscapeRef.current) {
        onEscapeRef.current();
        return;
      }

      if (e.key !== 'Tab') return;

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
      if (restoreFocusRef.current && previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [isActive]);

  return containerRef;
};

export default {
  SkipLink,
  LiveRegion,
  useAnnouncement,
  useFocusTrap
};
