/**
 * Central column with vertical side borders — supermemory catalog layout.
 */
const LandingFrame = ({ children }) => (
  <div className="landing-frame-outer">
    <div className="landing-frame-column">{children}</div>
  </div>
);

export default LandingFrame;
