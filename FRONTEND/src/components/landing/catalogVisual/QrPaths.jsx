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
          width="28"
          height="28"
          fill={filled ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.12)'}
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="1"
        />
      ))
    )}
    <path
      className="catalog-visual-draw catalog-visual-draw-delay-5"
      d="M 128 248 L 352 248"
      stroke="rgba(255,255,255,0.35)"
      strokeWidth="1"
      strokeDasharray="6 8"
    />
  </>
);

export default QrPaths;
