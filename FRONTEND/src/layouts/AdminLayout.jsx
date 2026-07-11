import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROUTES } from '../constants/routes';
import { isAdminUser } from '../utils/isAdmin';
import CatalogPageLoader from './CatalogPageLoader';

const AdminLayout = () => {
  const { user, authChecked } = useAuth();

  if (!authChecked) {
    return <CatalogPageLoader message="Checking authentication…" />;
  }

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (!isAdminUser(user.email)) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <Outlet />;
};

export default AdminLayout;
