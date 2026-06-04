const ManagePaths = () => (
  <>
    {[88, 128, 168, 208].map((y, i) => (
      <g key={y}>
        <path
          className={`catalog-visual-draw catalog-visual-draw-delay-${i + 2}`}
          d={`M 72 ${y} L 408 ${y}`}
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="1"
        />
        <path
          className={`catalog-visual-draw catalog-visual-draw-delay-${i + 3}`}
          d={`M 88 ${y + 20} L 280 ${y + 20}`}
          stroke="rgba(255,255,255,0.7)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle
          className={`catalog-visual-draw catalog-visual-draw-delay-${i + 3}`}
          cx="360"
          cy={y + 20}
          r="4"
          fill="rgba(255,255,255,0.2)"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth="1"
        />
      </g>
    ))}
  </>
);

export default ManagePaths;
