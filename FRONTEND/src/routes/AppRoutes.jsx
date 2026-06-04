import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import GuestOnlyLayout from '../layouts/GuestOnlyLayout';
import ProtectedLayout from '../layouts/ProtectedLayout';
import AuthPageLayout from '../layouts/AuthPageLayout';
import CatalogPageLoader from '../layouts/CatalogPageLoader';
import { AUTH_PAGE_HANDLES } from './authPageHandles';
import {
  ForgotPasswordRoute,
  LoginRoute,
  RegisterRoute,
  ResetPasswordRoute,
  VerifyEmailRoute
} from './authRoutes';

const LandingPage = lazy(() => import('../components/LandingPage'));
const Dashboard = lazy(() => import('../components/Dashboard'));
const AccountSettings = lazy(() => import('../components/AccountSettings'));
const PrivacyPage = lazy(() => import('../components/PrivacyPage'));
const NotFound = lazy(() => import('../components/NotFound'));

const AppRoutes = () => (
  <Suspense fallback={<CatalogPageLoader message="Loading page…" />}>
    <Routes>
      <Route element={<GuestOnlyLayout />}>
        <Route path={ROUTES.HOME} element={<LandingPage />} />

        <Route element={<AuthPageLayout />}>
          <Route
            path={ROUTES.LOGIN}
            handle={{ authPage: AUTH_PAGE_HANDLES.login }}
            element={<LoginRoute />}
          />
          <Route
            path={ROUTES.REGISTER}
            handle={{ authPage: AUTH_PAGE_HANDLES.register }}
            element={<RegisterRoute />}
          />
          <Route
            path={ROUTES.FORGOT_PASSWORD}
            handle={{ authPage: AUTH_PAGE_HANDLES.forgotPassword }}
            element={<ForgotPasswordRoute />}
          />
          <Route
            path={`${ROUTES.RESET_PASSWORD}/:token`}
            handle={{ authPage: AUTH_PAGE_HANDLES.resetPassword }}
            element={<ResetPasswordRoute />}
          />
          <Route
            path={`${ROUTES.VERIFY_EMAIL}/:token`}
            handle={{ authPage: AUTH_PAGE_HANDLES.verifyEmail }}
            element={<VerifyEmailRoute />}
          />
        </Route>
      </Route>

      <Route element={<ProtectedLayout />}>
        <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
        <Route path={ROUTES.SETTINGS} element={<AccountSettings />} />
      </Route>

      <Route path={ROUTES.PRIVACY} element={<PrivacyPage />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  </Suspense>
);

export default AppRoutes;
