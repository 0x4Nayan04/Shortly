import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROUTES } from '../constants/routes';
import { loadInstrumentSerifFont } from '../utils/loadInstrumentSerifFont';

const GuestOnlyLayout = () => {
  const { user, authChecked } = useAuth();

  useEffect(() => {
    loadInstrumentSerifFont();
  }, []);

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
