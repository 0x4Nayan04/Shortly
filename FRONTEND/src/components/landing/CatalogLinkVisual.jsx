/**
 * Per-feature SVG decoration for the catalog panel.
 * Stroke-draw on enter / tab change; ambient motion via SMIL.
 */

import { useEffect, useRef, useState } from 'react';

const CORNER_PATHS = (
  <>
    <path
      className='catalog-visual-draw catalog-visual-draw-delay-1'
      d='M 32 48 L 32 32 L 48 32'
      stroke='rgba(255,255,255,0.45)'
      strokeWidth='1'
      strokeLinecap='square'
    />
    <path
      className='catalog-visual-draw catalog-visual-draw-delay-2'
      d='M 448 232 L 448 248 L 432 248'
      stroke='rgba(255,255,255,0.45)'
      strokeWidth='1'
      strokeLinecap='square'
    />
  </>
);

const ShortenPaths = ({ gradId, motion }) => (
  <>
    <path
      className='catalog-visual-draw catalog-visual-draw-delay-3'
      d='M 56 88 C 96 88, 108 52, 148 52 S 196 118, 236 118'
      stroke='rgba(255,255,255,0.35)'
      strokeWidth='1.5'
      strokeLinecap='round'
    />
    <path
      className='catalog-visual-draw catalog-visual-draw-delay-4'
      d='M 252 118 L 272 118 M 264 110 L 272 118 L 264 126'
      stroke='rgba(255,255,255,0.6)'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      className='catalog-visual-draw catalog-visual-draw-delay-5'
      d='M 288 118 L 368 118'
      stroke='rgba(255,255,255,0.85)'
      strokeWidth='2'
      strokeLinecap='round'
    />
    <path
      className='catalog-visual-flow-line'
      d='M 80 168 L 400 168'
      stroke={`url(#${gradId})`}
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeDasharray='6 10'>
      {motion && (
        <animate
          attributeName='stroke-dashoffset'
          values='0;-32'
          dur='5s'
          repeatCount='indefinite'
        />
      )}
    </path>
    <circle
      cx={80}
      cy='168'
      r='3.5'
      fill='rgba(255,255,255,0.95)'>
      {motion && (
        <>
          <animateMotion
            dur='4.5s'
            repeatCount='indefinite'
            path='M 80 168 L 400 168'
          />
          <animate
            attributeName='opacity'
            values='0.4;1;0.4'
            dur='4.5s'
            repeatCount='indefinite'
          />
        </>
      )}
    </circle>
  </>
);

const AliasPaths = () => (
  <>
    <path
      className='catalog-visual-draw catalog-visual-draw-delay-3'
      d='M 72 120 L 408 120'
      stroke='rgba(255,255,255,0.25)'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeDasharray='4 8'
    />
    <path
      className='catalog-visual-draw catalog-visual-draw-delay-4'
      d='M 120 88 L 120 152 M 120 88 L 200 88 M 200 88 L 200 152'
      stroke='rgba(255,255,255,0.5)'
      strokeWidth='1.5'
      strokeLinecap='square'
    />
    <path
      className='catalog-visual-draw catalog-visual-draw-delay-5'
      d='M 248 96 L 360 96 L 360 144 L 248 144 Z'
      stroke='rgba(255,255,255,0.75)'
      strokeWidth='1.5'
      fill='rgba(255,255,255,0.06)'
    />
    <path
      className='catalog-visual-draw catalog-visual-draw-delay-5'
      d='M 264 120 L 344 120'
      stroke='rgba(255,255,255,0.9)'
      strokeWidth='2'
      strokeLinecap='round'
    />
  </>
);

const AnalyticsPaths = ({ motion }) => (
  <>
    {[72, 128, 184, 240, 296, 352].map((x, i) => (
      <rect
        key={x}
        className={`catalog-visual-draw catalog-visual-draw-delay-${Math.min(i + 3, 5)}`}
        x={x}
        y={200 - [48, 72, 56, 96, 64, 88][i]}
        width='28'
        height={[48, 72, 56, 96, 64, 88][i]}
        fill='rgba(255,255,255,0.12)'
        stroke='rgba(255,255,255,0.45)'
        strokeWidth='1'
      />
    ))}
    <path
      className='catalog-visual-draw catalog-visual-draw-delay-3'
      d='M 56 200 L 424 200'
      stroke='rgba(255,255,255,0.35)'
      strokeWidth='1'
    />
    <path
      className='catalog-visual-flow-line'
      d='M 88 88 L 392 88'
      stroke='rgba(255,255,255,0.55)'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeDasharray='4 6'>
      {motion && (
        <animate
          attributeName='stroke-dashoffset'
          values='0;-20'
          dur='3s'
          repeatCount='indefinite'
        />
      )}
    </path>
  </>
);

const QR_CELLS = [
  [1, 1, 0, 1, 1],
  [1, 0, 1, 0, 1],
  [0, 1, 1, 1, 0],
  [1, 0, 1, 0, 1],
  [1, 1, 0, 1, 1]
];

const QrPaths = () => (
  <>
    {QR_CELLS.flatMap((row, rowIndex) =>
      row.map((filled, colIndex) => (
        <rect
          key={`${rowIndex}-${colIndex}`}
          className={`catalog-visual-draw catalog-visual-draw-delay-${((rowIndex + colIndex) % 5) + 1}`}
          x={148 + colIndex * 36}
          y={72 + rowIndex * 36}
          width='28'
          height='28'
          fill={filled ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.12)'}
          stroke='rgba(255,255,255,0.4)'
          strokeWidth='1'
        />
      ))
    )}
    <path
      className='catalog-visual-draw catalog-visual-draw-delay-5'
      d='M 128 248 L 352 248'
      stroke='rgba(255,255,255,0.35)'
      strokeWidth='1'
      strokeDasharray='6 8'
    />
  </>
);

const ManagePaths = () => (
  <>
    {[88, 128, 168, 208].map((y, i) => (
      <g key={y}>
        <path
          className={`catalog-visual-draw catalog-visual-draw-delay-${i + 2}`}
          d={`M 72 ${y} L 408 ${y}`}
          stroke='rgba(255,255,255,0.35)'
          strokeWidth='1'
        />
        <path
          className={`catalog-visual-draw catalog-visual-draw-delay-${i + 3}`}
          d={`M 88 ${y + 20} L 280 ${y + 20}`}
          stroke='rgba(255,255,255,0.7)'
          strokeWidth='1.5'
          strokeLinecap='round'
        />
        <circle
          className={`catalog-visual-draw catalog-visual-draw-delay-${i + 3}`}
          cx='360'
          cy={y + 20}
          r='4'
          fill='rgba(255,255,255,0.2)'
          stroke='rgba(255,255,255,0.55)'
          strokeWidth='1'
        />
      </g>
    ))}
  </>
);

const VARIANT_PATHS = {
  shorten: ShortenPaths,
  alias: AliasPaths,
  analytics: AnalyticsPaths,
  qr: QrPaths,
  manage: ManagePaths
};

const CatalogLinkVisual = ({
  variant = 'shorten',
  playKey = '0',
  staticMode = false
}) => {
  const gradId = `catalog-flow-grad-${variant}`;
  const Paths = VARIANT_PATHS[variant] ?? VARIANT_PATHS.shorten;
  const svgRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onMotion = () => setReduceMotion(mq.matches);
    onMotion();
    mq.addEventListener('change', onMotion);
    return () => mq.removeEventListener('change', onMotion);
  }, []);

  useEffect(() => {
    if (staticMode) return undefined;
    const root = svgRef.current;
    if (!root) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.15, rootMargin: '0px 0px -6% 0px' }
    );

    observer.observe(root);
    return () => observer.disconnect();
  }, [staticMode]);

  useEffect(() => {
    if (staticMode) return undefined;
    const panel = svgRef.current?.closest('.catalog-visual');
    if (!panel) return undefined;
    panel.classList.toggle('catalog-visual--active', visible);
    return () => panel.classList.remove('catalog-visual--active');
  }, [visible, staticMode]);

  useEffect(() => {
    if (staticMode || !visible || reduceMotion) return;
    const root = svgRef.current;
    if (!root) return;

    root.querySelectorAll('.catalog-visual-draw').forEach((path) => {
      const length =
        typeof path.getTotalLength === 'function' ? path.getTotalLength() : 0;
      if (!length) return;
      path.style.strokeDasharray = `${length}`;
      path.style.strokeDashoffset = `${length}`;
      path.classList.remove('catalog-visual-draw-run');
      void path.getBoundingClientRect();
      path.classList.add('catalog-visual-draw-run');
    });
  }, [visible, reduceMotion, variant, playKey, staticMode]);

  const motion = !reduceMotion;

  if (staticMode) {
    return (
      <svg
        key={playKey}
        className='catalog-visual-svg catalog-visual-svg--static'
        viewBox='0 0 480 280'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
        aria-hidden='true'
        focusable='false'>
        <defs>
          <linearGradient
            id={gradId}
            x1='0%'
            y1='0%'
            x2='100%'
            y2='0%'>
            <stop
              offset='0%'
              stopColor='rgba(255,255,255,0)'
            />
            <stop
              offset='50%'
              stopColor='rgba(255,255,255,0.7)'
            />
            <stop
              offset='100%'
              stopColor='rgba(255,255,255,0)'
            />
          </linearGradient>
        </defs>

        {CORNER_PATHS}
        <Paths
          gradId={gradId}
          motion={false}
        />

        {variant === 'shorten' &&
          [120, 240, 360].map((cx) => (
            <circle
              key={cx}
              cx={cx}
              cy='168'
              r='4'
              fill='rgba(255,255,255,0.15)'
              stroke='rgba(255,255,255,0.55)'
              strokeWidth='1'
            />
          ))}
      </svg>
    );
  }

  return (
    <svg
      ref={svgRef}
      key={playKey}
      className={`catalog-visual-svg${visible ? ' catalog-visual-svg--active' : ''}`}
      viewBox='0 0 480 280'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
      focusable='false'>
      <defs>
        <linearGradient
          id={gradId}
          x1='0%'
          y1='0%'
          x2='100%'
          y2='0%'>
          <stop
            offset='0%'
            stopColor='rgba(255,255,255,0)'
          />
          <stop
            offset='50%'
            stopColor='rgba(255,255,255,0.7)'
          />
          <stop
            offset='100%'
            stopColor='rgba(255,255,255,0)'
          />
        </linearGradient>
      </defs>

      {CORNER_PATHS}
      <Paths
        gradId={gradId}
        motion={motion}
      />

      {variant === 'shorten' &&
        [
          { cx: 120, delay: '0s' },
          { cx: 240, delay: '0.6s' },
          { cx: 360, delay: '1.2s' }
        ].map(({ cx, delay }) => (
          <circle
            key={cx}
            cx={cx}
            cy='168'
            r='4'
            fill='rgba(255,255,255,0.15)'
            stroke='rgba(255,255,255,0.55)'
            strokeWidth='1'>
            {motion && (
              <>
                <animate
                  attributeName='opacity'
                  values='0.4;1;0.4'
                  dur='2.8s'
                  begin={delay}
                  repeatCount='indefinite'
                />
                <animate
                  attributeName='r'
                  values='4;5;4'
                  dur='2.8s'
                  begin={delay}
                  repeatCount='indefinite'
                />
              </>
            )}
          </circle>
        ))}

      {variant === 'shorten' && (
        <g transform='translate(240 118)'>
          <circle
            cx='0'
            cy='0'
            r='52'
            stroke='rgba(255,255,255,0.14)'
            strokeWidth='1'
            strokeDasharray='3 9'
            fill='none'>
            {motion && (
              <animateTransform
                attributeName='transform'
                type='rotate'
                from='0'
                to='360'
                dur='16s'
                repeatCount='indefinite'
              />
            )}
          </circle>
        </g>
      )}
    </svg>
  );
};

export default CatalogLinkVisual;
