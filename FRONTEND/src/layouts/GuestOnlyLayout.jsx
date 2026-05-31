import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROUTES } from '../constants/routes';

const GuestOnlyLayout = () => {
  const { user, authChecked } = useAuth();

  if (authChecked && user) {
    return (
      <Navigate
        to={ROUTES.DASHBOARD}
        replace
      />
    );
  }

  return <Outlet />;
};

export default GuestOnlyLayout;
