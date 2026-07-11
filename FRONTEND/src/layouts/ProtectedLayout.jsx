import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROUTES } from '../constants/routes';
import {
  LandingFrameInner,
  LandingSectionBlock
} from '../components/app/AppCatalogShell';
import { ErrorPanel } from '../components/ErrorPanel';
import CatalogPageLoader from './CatalogPageLoader';
import CatalogPageShell from './CatalogPageShell';

const AuthUnavailableState = ({ message, onRetry }) => (
  <CatalogPageShell>
    <LandingSectionBlock label="SESSION" index={1} total={1}>
      <LandingFrameInner className="flex min-h-[50vh] items-center justify-center py-12">
        <ErrorPanel
          title="Authentication temporarily unavailable"
          description={`${message} Please try again before signing in.`}
          variant="prominent"
          headingLevel="h1"
        >
          <button type="button" className="sm-btn sm-btn-primary" onClick={onRetry}>
            Retry
          </button>
        </ErrorPanel>
      </LandingFrameInner>
    </LandingSectionBlock>
  </CatalogPageShell>
);

const ProtectedLayout = () => {
  const { user, authChecked, authError, retryAuthCheck } = useAuth();
  const location = useLocation();

  if (!authChecked) {
    return <CatalogPageLoader message="Checking authentication…" />;
  }

  if (authError?.type === 'unavailable') {
    return (
      <AuthUnavailableState
        message={authError.message}
        onRetry={retryAuthCheck}
      />
    );
  }

  if (!user) {
    const returnTo = `${location.pathname}${location.search}${location.hash}`;
    return (
      <Navigate
        to={`${ROUTES.LOGIN}?returnTo=${encodeURIComponent(returnTo)}`}
        replace
      />
    );
  }

  return <Outlet />;
};

export default ProtectedLayout;
