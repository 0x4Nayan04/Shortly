const CORNER_PATHS = (
  <>
    <path
      className="catalog-visual-draw catalog-visual-draw-delay-1"
      d="M 32 48 L 32 32 L 48 32"
      stroke="rgba(255,255,255,0.45)"
      strokeWidth="1"
      strokeLinecap="square"
    />
    <path
      className="catalog-visual-draw catalog-visual-draw-delay-2"
      d="M 448 232 L 448 248 L 432 248"
      stroke="rgba(255,255,255,0.45)"
      strokeWidth="1"
      strokeLinecap="square"
    />
  </>
);

const CatalogSvgShell = function CatalogSvgShell({
  className,
  gradId,
  playKey,
  children,
  ref
}) {
  return (
    <svg
      ref={ref}
      key={playKey}
      className={className}
      viewBox="0 0 480 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(255,255,255,0)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0.7)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>

      {CORNER_PATHS}
      {children}
    </svg>
  );
};

export default CatalogSvgShell;
