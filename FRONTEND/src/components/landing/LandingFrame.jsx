/**
 * Central column with vertical side borders — supermemory catalog layout.
 */

import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

const PIN_EASE = [0, 0, 0.2, 1];
const PIN_DURATION_S = 0.18;
const PINNED_SHADOW = '0 1px 0 rgba(0, 0, 0, 0.06)';
const UNPINNED_SHADOW = '0 0 0 rgba(0, 0, 0, 0)';

const getNavHeightPx = () => {
  const root = document.documentElement;
  const raw = getComputedStyle(root).getPropertyValue('--nav-height').trim();
  if (!raw) return 64;
  const value = parseFloat(raw);
  if (Number.isNaN(value)) return 64;
  if (raw.endsWith('rem')) {
    const fontSize = parseFloat(getComputedStyle(root).fontSize) || 16;
    return value * fontSize;
  }
  return value;
};

/** True while the bar is stuck under the nav and its section still occupies the viewport. */
const useSectionBarPinned = (barRef, blockRef) => {
  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    const bar = barRef.current;
    const block = blockRef.current;
    if (!bar || !block) return undefined;

    let rafId = 0;

    const update = () => {
      rafId = 0;
      const navPx = getNavHeightPx();
      const barRect = bar.getBoundingClientRect();
      const blockRect = block.getBoundingClientRect();
      const barHeight = barRect.height;
      const stuck =
        barRect.top <= navPx + 0.5 &&
        blockRect.bottom > navPx + barHeight + 0.5;

      setIsPinned((prev) => (prev === stuck ? prev : stuck));
    };

    const scheduleUpdate = () => {
      if (!rafId) rafId = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate, { passive: true });

    return () => {
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [barRef, blockRef]);

  return isPinned;
};

export const LandingSectionBar = ({ label, index, total, blockRef }) => {
  const barRef = useRef(null);
  const reduceMotion = useReducedMotion();
  const isPinned = useSectionBarPinned(barRef, blockRef);

  return (
    <motion.div
      ref={barRef}
      className='landing-section-bar landing-frame-px'
      data-pinned={isPinned ? 'true' : 'false'}
      aria-hidden={!label}
      initial={false}
      animate={{
        boxShadow: isPinned ? PINNED_SHADOW : UNPINNED_SHADOW
      }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : { duration: PIN_DURATION_S, ease: PIN_EASE }
      }>
      <motion.span
        className='landing-section-bar-label'
        initial={false}
        animate={{ opacity: isPinned ? 1 : 0.92 }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : { duration: PIN_DURATION_S, ease: PIN_EASE }
        }>
        <motion.span
          className='landing-section-bar-chevron'
          aria-hidden='true'
          initial={false}
          animate={{ x: isPinned ? 3 : 0 }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { duration: PIN_DURATION_S, ease: PIN_EASE }
          }>
          〉
        </motion.span>
        {label}
      </motion.span>
      {index != null && total != null && (
        <motion.span
          className='landing-section-bar-counter tabular-nums'
          initial={false}
          animate={{ opacity: isPinned ? 1 : 0.85 }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { duration: PIN_DURATION_S, ease: PIN_EASE }
          }>
          [{index}/{total}]
        </motion.span>
      )}
    </motion.div>
  );
};

/** Sticky header bar + section content as siblings (scroll-journey waypoint). */
export const LandingSectionBlock = ({
  label,
  index,
  total,
  children,
  className = ''
}) => {
  const blockRef = useRef(null);

  return (
    <div
      ref={blockRef}
      className={`landing-section-block ${className}`.trim()}>
      <LandingSectionBar
        blockRef={blockRef}
        label={label}
        index={index}
        total={total}
      />
      {children}
    </div>
  );
};

export const LandingFrameInner = ({ children, className = '' }) => (
  <div className={`landing-frame-inner ${className}`.trim()}>{children}</div>
);

const LandingFrame = ({ children }) => (
  <div className='landing-frame-outer'>
    <div className='landing-frame-column'>{children}</div>
  </div>
);

export default LandingFrame;
