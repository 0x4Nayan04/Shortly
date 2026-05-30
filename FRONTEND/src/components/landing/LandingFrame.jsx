/**
 * Central column with vertical side borders — supermemory catalog layout.
 */

export const LandingSectionBlock = ({
  children,
  className = ''
}) => {
  return (
    <div
      className={`landing-section-block ${className}`.trim()}>
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
