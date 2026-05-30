/**
 * Catalog-frame shell for app routes — reuses landing frame primitives.
 */

import LandingFrame, {
  LandingFrameInner,
  LandingSectionBlock
} from '../landing/LandingFrame';

export { LandingFrameInner, LandingSectionBlock };

export const AppCatalogShell = ({ children, className = '' }) => (
  <div className={`app-page flex min-h-screen flex-col ${className}`.trim()}>
    <LandingFrame>
      {children}
    </LandingFrame>
  </div>
);

export default AppCatalogShell;
