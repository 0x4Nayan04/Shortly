import { useRef } from 'react';
import CatalogSvgShell from './CatalogSvgShell';
import { VARIANT_PATHS } from './catalogVisual/variantPaths';
import {
  useCatalogDrawAnimation,
  useElementVisible,
  useReducedMotion
} from '../../hooks/useCatalogMotion';

const shortenDots = [120, 240, 360];

const CatalogLinkVisualStatic = ({ variant, playKey }) => {
  const gradId = `catalog-flow-grad-${variant}`;
  const Paths = VARIANT_PATHS[variant] ?? VARIANT_PATHS.shorten;

  return (
    <CatalogSvgShell
      className="catalog-visual-svg catalog-visual-svg--static"
      gradId={gradId}
      playKey={playKey}
    >
      <Paths gradId={gradId} motion={false} />
      {variant === 'shorten' &&
        shortenDots.map((cx) => (
          <circle
            key={cx}
            cx={cx}
            cy="168"
            r="4"
            fill="rgba(255,255,255,0.15)"
            stroke="rgba(255,255,255,0.55)"
            strokeWidth="1"
          />
        ))}
    </CatalogSvgShell>
  );
};

const CatalogLinkVisualAnimated = ({ variant, playKey }) => {
  const gradId = `catalog-flow-grad-${variant}`;
  const Paths = VARIANT_PATHS[variant] ?? VARIANT_PATHS.shorten;
  const svgRef = useRef(null);
  const reduceMotion = useReducedMotion();
  const visible = useElementVisible(svgRef);

  useCatalogDrawAnimation({ svgRef, visible, reduceMotion, variant, playKey });

  const motion = !reduceMotion;

  return (
    <CatalogSvgShell
      ref={svgRef}
      className={`catalog-visual-svg${visible ? ' catalog-visual-svg--active' : ''}`}
      gradId={gradId}
      playKey={playKey}
    >
      <Paths gradId={gradId} motion={motion} />

      {variant === 'shorten' &&
        [
          { cx: 120, delay: '0s' },
          { cx: 240, delay: '0.6s' },
          { cx: 360, delay: '1.2s' }
        ].map(({ cx, delay }) => (
          <circle
            key={cx}
            cx={cx}
            cy="168"
            r="4"
            fill="rgba(255,255,255,0.15)"
            stroke="rgba(255,255,255,0.55)"
            strokeWidth="1"
          >
            {motion && (
              <>
                <animate
                  attributeName="opacity"
                  values="0.4;1;0.4"
                  dur="2.8s"
                  begin={delay}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="r"
                  values="4;5;4"
                  dur="2.8s"
                  begin={delay}
                  repeatCount="indefinite"
                />
              </>
            )}
          </circle>
        ))}

      {variant === 'shorten' && (
        <g transform="translate(240 118)">
          <circle
            cx="0"
            cy="0"
            r="52"
            stroke="rgba(255,255,255,0.14)"
            strokeWidth="1"
            strokeDasharray="3 9"
            fill="none"
          >
            {motion && (
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0"
                to="360"
                dur="16s"
                repeatCount="indefinite"
              />
            )}
          </circle>
        </g>
      )}
    </CatalogSvgShell>
  );
};

const CatalogLinkVisual = ({
  variant = 'shorten',
  playKey = '0',
  staticMode = false
}) => {
  if (staticMode) {
    return <CatalogLinkVisualStatic variant={variant} playKey={playKey} />;
  }

  return <CatalogLinkVisualAnimated variant={variant} playKey={playKey} />;
};

export default CatalogLinkVisual;
