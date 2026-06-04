import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROUTES } from '../constants/routes';
import CatalogPageLoader from './CatalogPageLoader';

const ProtectedLayout = () => {
  const { user, authChecked } = useAuth();
  const location = useLocation();

  if (!authChecked) {
    return <CatalogPageLoader message="Checking authentication…" />;
  }

  if (!user) {
    return (
      <Navigate to={ROUTES.LOGIN} replace state={{ from: location.pathname }} />
    );
  }

  return <Outlet />;
};

export default ProtectedLayout;
