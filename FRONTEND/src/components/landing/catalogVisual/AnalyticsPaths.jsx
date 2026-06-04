const AnalyticsPaths = ({ motion }) => (
  <>
    {[72, 128, 184, 240, 296, 352].map((x, i) => (
      <rect
        key={x}
        className={`catalog-visual-draw catalog-visual-draw-delay-${Math.min(i + 3, 5)}`}
        x={x}
        y={200 - [48, 72, 56, 96, 64, 88][i]}
        width="28"
        height={[48, 72, 56, 96, 64, 88][i]}
        fill="rgba(255,255,255,0.12)"
        stroke="rgba(255,255,255,0.45)"
        strokeWidth="1"
      />
    ))}
    <path
      className="catalog-visual-draw catalog-visual-draw-delay-3"
      d="M 56 200 L 424 200"
      stroke="rgba(255,255,255,0.35)"
      strokeWidth="1"
    />
    <path
      className="catalog-visual-flow-line"
      d="M 88 88 L 392 88"
      stroke="rgba(255,255,255,0.55)"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeDasharray="4 6"
    >
      {motion && (
        <animate
          attributeName="stroke-dashoffset"
          values="0;-20"
          dur="3s"
          repeatCount="indefinite"
        />
      )}
    </path>
  </>
);

export default AnalyticsPaths;
