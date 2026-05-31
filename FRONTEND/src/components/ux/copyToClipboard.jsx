import { useCallback, useEffect, useRef, useState } from 'react';
import { showToast } from './toast';

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
