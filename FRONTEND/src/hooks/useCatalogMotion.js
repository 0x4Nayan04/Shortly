import { useEffect, useRef, useSyncExternalStore } from 'react';

const subscribeReducedMotion = (onStoreChange) => {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  mq.addEventListener('change', onStoreChange);
  return () => mq.removeEventListener('change', onStoreChange);
};

const getReducedMotionSnapshot = () => {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

export const useReducedMotion = () =>
  useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    () => false
  );

export const useElementVisible = (elementRef) => {
  const visibleRef = useRef(false);

  return useSyncExternalStore(
    (onStoreChange) => {
      const root = elementRef.current;
      if (!root || typeof IntersectionObserver === 'undefined') return () => {};

      const observer = new IntersectionObserver(
        ([entry]) => {
          visibleRef.current = entry.isIntersecting;
          onStoreChange();
        },
        { threshold: 0.15, rootMargin: '0px 0px -6% 0px' }
      );

      observer.observe(root);
      return () => observer.disconnect();
    },
    () => visibleRef.current,
    () => false
  );
};

export const useCatalogDrawAnimation = ({
  svgRef,
  visible,
  reduceMotion,
  variant,
  playKey
}) => {
  useEffect(() => {
    const panel = svgRef.current?.closest('.catalog-visual');
    if (!panel) return undefined;
    panel.classList.toggle('catalog-visual--active', visible);
    return () => panel.classList.remove('catalog-visual--active');
  }, [visible, svgRef]);

  useEffect(() => {
    if (!visible || reduceMotion) return;
    const root = svgRef.current;
    if (!root) return;

    const paths = Array.from(root.querySelectorAll('.catalog-visual-draw'));
    const lengths = paths.map((path) =>
      typeof path.getTotalLength === 'function' ? path.getTotalLength() : 0
    );

    paths.forEach((path, index) => {
      const length = lengths[index];
      if (!length) return;
      path.classList.remove('catalog-visual-draw-run');
    });

    void root.getBoundingClientRect();

    paths.forEach((path, index) => {
      const length = lengths[index];
      if (!length) return;
      path.style.cssText = `${path.style.cssText};stroke-dasharray:${length};stroke-dashoffset:${length};`;
      path.classList.add('catalog-visual-draw-run');
    });
  }, [visible, reduceMotion, variant, playKey, svgRef]);
};
