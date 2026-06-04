const ShortenPaths = ({ gradId, motion }) => (
  <>
    <path
      className="catalog-visual-draw catalog-visual-draw-delay-3"
      d="M 56 88 C 96 88, 108 52, 148 52 S 196 118, 236 118"
      stroke="rgba(255,255,255,0.35)"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      className="catalog-visual-draw catalog-visual-draw-delay-4"
      d="M 252 118 L 272 118 M 264 110 L 272 118 L 264 126"
      stroke="rgba(255,255,255,0.6)"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      className="catalog-visual-draw catalog-visual-draw-delay-5"
      d="M 288 118 L 368 118"
      stroke="rgba(255,255,255,0.85)"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      className="catalog-visual-flow-line"
      d="M 80 168 L 400 168"
      stroke={`url(#${gradId})`}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeDasharray="6 10"
    >
      {motion && (
        <animate
          attributeName="stroke-dashoffset"
          values="0;-32"
          dur="5s"
          repeatCount="indefinite"
        />
      )}
    </path>
    <circle cx={80} cy="168" r="3.5" fill="rgba(255,255,255,0.95)">
      {motion && (
        <>
          <animateMotion
            dur="4.5s"
            repeatCount="indefinite"
            path="M 80 168 L 400 168"
          />
          <animate
            attributeName="opacity"
            values="0.4;1;0.4"
            dur="4.5s"
            repeatCount="indefinite"
          />
        </>
      )}
    </circle>
  </>
);

export default ShortenPaths;
