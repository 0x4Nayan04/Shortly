/**
 * Catalog-frame shell for app routes — reuses landing frame primitives.
 */

import LandingFrame, {
  LandingFrameInner,
  LandingSectionBar,
  LandingSectionBlock
} from '../landing/LandingFrame';

export { LandingFrameInner, LandingSectionBar, LandingSectionBlock };

export const AppCatalogShell = ({ children, className = '' }) => (
  <div className={`app-page flex min-h-screen flex-col ${className}`.trim()}>
    <LandingFrame>{children}</LandingFrame>
  </div>
);

export default AppCatalogShell;
