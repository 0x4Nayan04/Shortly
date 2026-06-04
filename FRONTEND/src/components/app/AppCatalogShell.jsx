/**
 * Catalog-frame shell for app routes — reuses landing frame primitives.
 */

import LandingFrame from '../landing/LandingFrame';
import { LandingFrameInner } from '../landing/LandingFrameInner';
import { LandingSectionBlock } from '../landing/LandingSectionBlock';

export { LandingFrameInner, LandingSectionBlock };

const AppCatalogShell = ({ children, className = '' }) => (
  <div className={`app-page flex min-h-screen flex-col ${className}`.trim()}>
    <LandingFrame>{children}</LandingFrame>
  </div>
);

export default AppCatalogShell;
