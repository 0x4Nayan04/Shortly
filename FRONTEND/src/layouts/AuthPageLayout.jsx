import { Suspense } from 'react';
import { Outlet, useMatches } from 'react-router-dom';
import {
  LandingFrameInner,
  LandingSectionBlock
} from '../components/app/AppCatalogShell';
import HeroDotGridWrap from '../components/landing/HeroDotGridWrap';
import { AuthPageLoader } from '../components/LoadingSpinner';
import CatalogPageShell from './CatalogPageShell';

const AuthPageLayout = () => {
  const matches = useMatches();
  const authPage = [...matches]
    .reverse()
    .find((match) => match.handle?.authPage)?.handle?.authPage;

  const {
    sectionLabel = 'AUTH',
    headingId = 'auth-heading',
    loadingMessage = 'Loading…',
    skeletonVariant = 'login',
    skeletonForgotRow
  } = authPage ?? {};

  return (
    <CatalogPageShell
      mainClassName="flex flex-1 flex-col"
      mainProps={{ 'aria-labelledby': headingId }}
    >
      <LandingSectionBlock
        className="auth-section-block"
        label={sectionLabel}
        index={1}
        total={1}
      >
        <HeroDotGridWrap
          wrapClassName="auth-page-dot-grid bg-surface"
          className="auth-page-inner"
        >
          <LandingFrameInner>
            <div className="auth-form-shell mx-auto w-full max-w-md">
              <Suspense
                fallback={
                  <AuthPageLoader
                    variant={skeletonVariant}
                    label={loadingMessage}
                    showForgotRow={skeletonForgotRow}
                  />
                }
              >
                <Outlet />
              </Suspense>
            </div>
          </LandingFrameInner>
        </HeroDotGridWrap>
      </LandingSectionBlock>
    </CatalogPageShell>
  );
};

export default AuthPageLayout;
