import { lazy, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getSafeReturnPath, ROUTES } from '../constants/routes';

const LoginForm = lazy(() => import('../components/LoginForm'));
const RegisterForm = lazy(() => import('../components/RegisterForm'));
const ForgotPassword = lazy(() => import('../components/ForgotPassword'));
const ResetPassword = lazy(() => import('../components/ResetPassword'));
const VerifyEmail = lazy(() => import('../components/VerifyEmail'));

export function LoginRoute() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const returnTo = getSafeReturnPath(searchParams.get('returnTo'));
  const returnQuery = returnTo
    ? `?returnTo=${encodeURIComponent(returnTo)}`
    : '';

  const handleLoginSuccess = useCallback(
    (response) => login(response, { returnTo }),
    [login, returnTo]
  );

  return (
    <LoginForm
      onLoginSuccess={handleLoginSuccess}
      switchToRegister={() => navigate(`${ROUTES.REGISTER}${returnQuery}`)}
      switchToForgotPassword={() => navigate(ROUTES.FORGOT_PASSWORD)}
    />
  );
}

export function RegisterRoute() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = getSafeReturnPath(searchParams.get('returnTo'));
  const returnQuery = returnTo
    ? `?returnTo=${encodeURIComponent(returnTo)}`
    : '';

  return (
    <RegisterForm
      switchToLogin={() => navigate(`${ROUTES.LOGIN}${returnQuery}`)}
    />
  );
}

export function ForgotPasswordRoute() {
  const navigate = useNavigate();

  return <ForgotPassword switchToLogin={() => navigate(ROUTES.LOGIN)} />;
}

export function ResetPasswordRoute() {
  return <ResetPassword />;
}

export function VerifyEmailRoute() {
  return <VerifyEmail />;
}
