import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate
} from 'react-router-dom';
import { getUrlStats } from './api/shortUrl.api';
import { getCurrentUser, logoutUser } from './api/user.api';
import {
  LiveRegion,
  SkipLink,
  useAnnouncement
} from './components/Accessibility';
import AppCatalogShell, {
  LandingFrameInner,
  LandingSectionBlock
} from './components/app/AppCatalogShell';
import AppNavbar from './components/app/AppNavbar';
import HeroDotGridWrap from './components/landing/HeroDotGridWrap';
import LoadingSpinner, { AuthPageLoader } from './components/LoadingSpinner';
import {
  showToast,
  useConfirmDialog,
  ConfirmDialog
} from './components/UxEnhancements';

const LandingPage = lazy(() => import('./components/LandingPage'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const LoginForm = lazy(() => import('./components/LoginForm'));
const RegisterForm = lazy(() => import('./components/RegisterForm'));
const AccountSettings = lazy(() => import('./components/AccountSettings'));
const UserProfileModal = lazy(() => import('./components/UserProfileModal'));
const PrivacyPage = lazy(() => import('./components/PrivacyPage'));
const ForgotPassword = lazy(() => import('./components/ForgotPassword'));
const ResetPassword = lazy(() => import('./components/ResetPassword'));
const NotFound = lazy(() => import('./components/NotFound'));

const AuthPageShell = ({
  user,
  onLogout,
  onShowRegister,
  onShowProfile,
  sectionLabel,
  headingId,
  loadingMessage,
  skeletonVariant = 'login',
  skeletonForgotRow,
  children
}) => (
  <AppCatalogShell>
    <AppNavbar
      user={user}
      onLogout={onLogout}
      onShowRegister={onShowRegister}
      onShowProfile={onShowProfile}
    />
    <main
      id='main-content'
      className='flex flex-1 flex-col'
      role='main'
      aria-labelledby={headingId}>
      <LandingSectionBlock
        className='auth-section-block'
        label={sectionLabel}
        index={1}
        total={1}>
        <HeroDotGridWrap
          wrapClassName='auth-page-dot-grid bg-surface'
          className='auth-page-inner'>
          <LandingFrameInner>
            <div className='auth-form-shell mx-auto w-full max-w-md'>
              <Suspense
                fallback={
                  <AuthPageLoader
                    variant={skeletonVariant}
                    label={loadingMessage}
                    showForgotRow={skeletonForgotRow}
                  />
                }>
                {children}
              </Suspense>
            </div>
          </LandingFrameInner>
        </HeroDotGridWrap>
      </LandingSectionBlock>
    </main>
  </AppCatalogShell>
);

const LoginPage = ({ user, navigate, onLoginSuccess, ...shellProps }) => {
  if (user) {
    return (
      <Navigate
        to='/dashboard'
        replace
      />
    );
  }

  return (
    <AuthPageShell
      {...shellProps}
      user={user}
      sectionLabel='SIGN IN'
      headingId='login-heading'
      loadingMessage='Loading sign in form'
      skeletonVariant='login'>
      <LoginForm
        onLoginSuccess={onLoginSuccess}
        switchToRegister={() => navigate('/register')}
        switchToForgotPassword={() => navigate('/forgot-password')}
      />
    </AuthPageShell>
  );
};

const RegisterPage = ({ user, navigate, onRegisterSuccess, ...shellProps }) => {
  if (user) {
    return (
      <Navigate
        to='/dashboard'
        replace
      />
    );
  }

  return (
    <AuthPageShell
      {...shellProps}
      user={user}
      sectionLabel='REGISTER'
      headingId='register-heading'
      loadingMessage='Loading sign up form'
      skeletonVariant='register'>
      <RegisterForm
        onRegisterSuccess={onRegisterSuccess}
        switchToLogin={() => navigate('/login')}
      />
    </AuthPageShell>
  );
};

const ForgotPasswordPage = ({ user, navigate, ...shellProps }) => {
  if (user) {
    return (
      <Navigate
        to='/dashboard'
        replace
      />
    );
  }

  return (
    <AuthPageShell
      {...shellProps}
      user={user}
      sectionLabel='RESET'
      headingId='forgot-heading'
      loadingMessage='Loading password reset form'
      skeletonVariant='compact'>
      <ForgotPassword switchToLogin={() => navigate('/login')} />
    </AuthPageShell>
  );
};

const ResetPasswordPage = ({ user, ...shellProps }) => {
  if (user) {
    return (
      <Navigate
        to='/dashboard'
        replace
      />
    );
  }

  return (
    <AuthPageShell
      {...shellProps}
      user={user}
      sectionLabel='NEW PASSWORD'
      headingId='reset-heading'
      loadingMessage='Loading new password form'
      skeletonVariant='login'
      skeletonForgotRow={false}>
      <ResetPassword />
    </AuthPageShell>
  );
};

/** Preload lazy protected-route chunks during auth so refresh shows one loader. */
const PROTECTED_ROUTE_PRELOADS = {
  '/dashboard': () => import('./components/Dashboard'),
  '/settings': () => import('./components/AccountSettings')
};

const CatalogPageLoader = ({ user, message, ...shellProps }) => (
  <AppCatalogShell>
    <AppNavbar
      user={user}
      {...shellProps}
    />
    <main
      id='main-content'
      className='flex-1'
      role='main'
      aria-busy='true'
      aria-label={message}>
      <LandingSectionBlock
        label='LOADING'
        index={1}
        total={1}>
        <LandingFrameInner className='flex min-h-[50vh] items-center justify-center py-12'>
          <LoadingSpinner
            size='lg'
            message={message}
          />
        </LandingFrameInner>
      </LandingSectionBlock>
    </main>
  </AppCatalogShell>
);

const ProtectedRoute = ({ user, authChecked, component, shellProps }) => {
  if (!authChecked) {
    return (
      <CatalogPageLoader
        user={user}
        message='Checking authentication...'
        {...shellProps}
      />
    );
  }

  if (!user) {
    return (
      <Navigate
        to='/login'
        replace
      />
    );
  }
  return component;
};

const App = () => {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userStats, setUserStats] = useState({
    totalUrls: 0,
    totalClicks: 0
  });
  const [announcement, announce] = useAnnouncement();
  const confirmLogout = useConfirmDialog();
  const navigate = useNavigate();
  const location = useLocation();

  const fetchUserStats = useCallback(async () => {
    try {
      const response = await getUrlStats();
      const payload = response?.data;
      if (payload?.stats) {
        setUserStats({
          totalUrls: payload.stats.totalUrls || 0,
          totalClicks: payload.stats.totalClicks || 0
        });
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  }, []);

  useEffect(() => {
    const routePreload =
      PROTECTED_ROUTE_PRELOADS[location.pathname]?.() ?? Promise.resolve();

    const checkAuthStatus = async () => {
      try {
        const response = await getCurrentUser();
        const userData = response?.data?.user || response?.user;
        if (userData) {
          setUser(userData);
          if (
            location.pathname === '/login' ||
            location.pathname === '/register' ||
            location.pathname === '/forgot-password' ||
            location.pathname.startsWith('/reset-password/')
          ) {
            navigate('/dashboard');
          }
        }
      } catch {
        if (
          location.pathname === '/dashboard' ||
          location.pathname === '/settings'
        ) {
          showToast.error('Session expired. Please sign in again.');
          navigate('/login');
        }
      } finally {
        await routePreload;
        setAuthChecked(true);
      }
    };

    checkAuthStatus();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAuthSuccess = useCallback(
    async (response) => {
      const userData = response?.data?.user || response?.user;
      if (userData) {
        setUser(userData);
      } else {
        try {
          const current = await getCurrentUser();
          const currentUser = current?.data?.user || current?.user;
          if (currentUser) {
            setUser(currentUser);
          } else {
            showToast.error(
              'Signed in but could not load your profile. Please try again.'
            );
            return;
          }
        } catch {
          showToast.error(
            'Signed in but could not load your profile. Please try again.'
          );
          return;
        }
      }
      announce('Successfully signed in. Redirecting to dashboard.');
      showToast.success('Welcome back! You have been signed in.');
      navigate('/dashboard');
    },
    [navigate, announce]
  );

  const handleLogout = useCallback(async () => {
    const confirmed = await confirmLogout.confirm({
      title: 'Sign out',
      message:
        'Are you sure you want to sign out? You will need to sign in again to manage your links.',
      confirmLabel: 'Sign out',
      cancelLabel: 'Cancel',
      variant: 'danger'
    });

    if (!confirmed) return;

    try {
      await logoutUser();
      showToast.success('You have been signed out.');
    } catch {
      // Still logout locally even if API fails
    } finally {
      setUser(null);
      announce('You have been signed out.');
      navigate('/');
    }
  }, [navigate, announce, confirmLogout]);

  const showAuth = useCallback(() => navigate('/login'), [navigate]);
  const showRegister = useCallback(() => navigate('/register'), [navigate]);

  const handleShowProfile = useCallback(() => {
    fetchUserStats();
    setShowProfileModal(true);
  }, [fetchUserStats]);

  const handleCloseProfile = useCallback(() => setShowProfileModal(false), []);

  const shellProps = {
    onLogout: handleLogout,
    onShowAuth: showAuth,
    onShowRegister: showRegister,
    onShowProfile: handleShowProfile
  };

  return (
    <div className='min-h-screen'>
      <SkipLink targetId='main-content' />

      <LiveRegion
        message={announcement}
        politeness='polite'
      />

      <Suspense
        fallback={
          <CatalogPageLoader
            user={user}
            message='Loading page...'
            {...shellProps}
          />
        }>
        <Routes>
          <Route
            path='/'
            element={
              <LandingPage
                onShowAuth={showAuth}
                onLogout={handleLogout}
                user={user}
              />
            }
          />
          <Route
            path='/login'
            element={
              <LoginPage
                user={user}
                navigate={navigate}
                onLoginSuccess={handleAuthSuccess}
                {...shellProps}
              />
            }
          />
          <Route
            path='/register'
            element={
              <RegisterPage
                user={user}
                navigate={navigate}
                onRegisterSuccess={handleAuthSuccess}
                {...shellProps}
              />
            }
          />
          <Route
            path='/dashboard'
            element={
              <ProtectedRoute
                user={user}
                authChecked={authChecked}
                shellProps={shellProps}
                component={
                  <Dashboard
                    user={user}
                    onLogout={handleLogout}
                    onShowAuth={showAuth}
                    onShowProfile={handleShowProfile}
                  />
                }
              />
            }
          />
          <Route
            path='/settings'
            element={
              <ProtectedRoute
                user={user}
                authChecked={authChecked}
                shellProps={shellProps}
                component={
                  <AccountSettings
                    user={user}
                    {...shellProps}
                  />
                }
              />
            }
          />
          <Route
            path='/privacy'
            element={
              <PrivacyPage
                user={user}
                {...shellProps}
              />
            }
          />
          <Route
            path='/forgot-password'
            element={
              <ForgotPasswordPage
                user={user}
                navigate={navigate}
                {...shellProps}
              />
            }
          />
          <Route
            path='/reset-password/:token'
            element={
              <ResetPasswordPage
                user={user}
                {...shellProps}
              />
            }
          />
          <Route
            path='*'
            element={
              <NotFound
                user={user}
                {...shellProps}
              />
            }
          />
        </Routes>
      </Suspense>

      <ConfirmDialog {...confirmLogout} />

      {user && showProfileModal && (
        <Suspense fallback={null}>
          <UserProfileModal
            isOpen={showProfileModal}
            onClose={handleCloseProfile}
            user={user}
            userStats={userStats}
          />
        </Suspense>
      )}
    </div>
  );
};

export default App;
