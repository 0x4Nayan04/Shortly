import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BrandedSpinner } from '../components/LoadingSpinner';
import { ROUTES } from '../constants/routes';

const GuestOnlyLayout = () => {
  const { user, authChecked } = useAuth();

  if (!authChecked) {
    return (
      <output
        className="fixed inset-0 z-50 flex items-center justify-center bg-surface"
        aria-live="polite"
        aria-label="Loading"
      >
        <BrandedSpinner size="md" decorative />
      </output>
    );
  }

  if (user) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <Outlet />;
};

export default GuestOnlyLayout;
