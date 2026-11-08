import { useEffect, useRef, useState } from 'react';
import { DotGridSpotlight } from '../DotGridSpotlight';

const DOT_GRID_DEFAULTS = {
  dotColor: 'rgba(124, 183, 255, 0.32)',
  activeDotColor: 'rgba(5, 98, 239, 0.62)',
  spacing: 20,
  baseRadius: 1,
  activeRadius: 1.75,
  interactionRadius: 168,
  activeMaxAlpha: 1,
  activeMinAlpha: 0.38
};


const HeroDotGridWrap = ({ children, className = '', wrapClassName = '' }) => {
  const wrapRef = useRef(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const root = wrapRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { rootMargin: '80px 0px', threshold: 0 }
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={wrapRef} className={`hero-dot-grid-wrap ${wrapClassName}`.trim()}>
      <div className="hero-dot-grid-mask" aria-hidden="true">
        {isVisible ? (
          <DotGridSpotlight interactionRef={wrapRef} {...DOT_GRID_DEFAULTS} />
        ) : null}
      </div>
      <div className={`relative z-10 ${className}`.trim()}>{children}</div>
    </div>
  );
};

export default HeroDotGridWrap;
