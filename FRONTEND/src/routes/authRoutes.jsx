/* eslint-disable react-refresh/only-export-components */
import { lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROUTES } from '../constants/routes';

const LoginForm = lazy(() => import('../components/LoginForm'));
const RegisterForm = lazy(() => import('../components/RegisterForm'));
const ForgotPassword = lazy(() => import('../components/ForgotPassword'));
const ResetPassword = lazy(() => import('../components/ResetPassword'));
const VerifyEmail = lazy(() => import('../components/VerifyEmail'));

export function LoginRoute() {
  const navigate = useNavigate();
  const { login } = useAuth();

  return (
    <LoginForm
      onLoginSuccess={login}
      switchToRegister={() => navigate(ROUTES.REGISTER)}
      switchToForgotPassword={() => navigate(ROUTES.FORGOT_PASSWORD)}
    />
  );
}

export function RegisterRoute() {
  const navigate = useNavigate();
  const { login } = useAuth();

  return (
    <RegisterForm
      onRegisterSuccess={login}
      switchToLogin={() => navigate(ROUTES.LOGIN)}
    />
  );
}

export function ForgotPasswordRoute() {
  const navigate = useNavigate();

  return (
    <ForgotPassword switchToLogin={() => navigate(ROUTES.LOGIN)} />
  );
}

export function ResetPasswordRoute() {
  return <ResetPassword />;
}

export function VerifyEmailRoute() {
  return <VerifyEmail />;
}

export const AUTH_PAGE_HANDLES = {
  login: {
    sectionLabel: 'SIGN IN',
    headingId: 'login-heading',
    loadingMessage: 'Loading sign in form',
    skeletonVariant: 'login'
  },
  register: {
    sectionLabel: 'REGISTER',
    headingId: 'register-heading',
    loadingMessage: 'Loading sign up form',
    skeletonVariant: 'register'
  },
  forgotPassword: {
    sectionLabel: 'RESET',
    headingId: 'forgot-heading',
    loadingMessage: 'Loading password reset form',
    skeletonVariant: 'compact'
  },
  resetPassword: {
    sectionLabel: 'NEW PASSWORD',
    headingId: 'reset-heading',
    loadingMessage: 'Loading new password form',
    skeletonVariant: 'login',
    skeletonForgotRow: false
  },
  verifyEmail: {
    sectionLabel: 'VERIFY',
    headingId: 'verify-heading',
    loadingMessage: 'Verifying your email',
    skeletonVariant: 'compact'
  }
};
