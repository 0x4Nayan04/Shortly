import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
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
import { PageLoader } from './components/LoadingSpinner';
import Navbar from './components/Navbar';
import {
  showToast,
  useConfirmDialog,
  ConfirmDialog
} from './components/UxEnhancements';

// Lazy load heavy components for code splitting
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

// Helper components for proper routing
const LoginPage = ({ user, navigate, onLoginSuccess }) => {
  if (user) {
    return (
      <Navigate
        to='/dashboard'
        replace
      />
    );
  }

  return (
    <main
      id='main-content'
      className='min-h-[calc(100vh-4rem)] bg-gray-50 flex items-center justify-center py-12 px-4'
      role='main'
      aria-labelledby='login-heading'>
      <div className='max-w-md w-full'>
        <button
          onClick={() => navigate('/')}
          className='mb-6 flex items-center text-gray-600 hover:text-gray-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded-lg px-2 py-1'
          aria-label='Go back to home page'>
          <ChevronLeft
            className='w-5 h-5 mr-2'
            aria-hidden='true'
          />
          Back to home
        </button>
        <Suspense fallback={<PageLoader message='Loading login form...' />}>
          <LoginForm
            onLoginSuccess={onLoginSuccess}
            switchToRegister={() => navigate('/register')}
            switchToForgotPassword={() => navigate('/forgot-password')}
          />
        </Suspense>
      </div>
    </main>
  );
};

const RegisterPage = ({ user, navigate, onRegisterSuccess }) => {
  if (user) {
    return (
      <Navigate
        to='/dashboard'
        replace
      />
    );
  }

  return (
    <main
      id='main-content'
      className='min-h-[calc(100vh-4rem)] bg-gray-50 flex items-center justify-center py-12 px-4'
      role='main'
      aria-labelledby='register-heading'>
      <div className='max-w-md w-full'>
        <button
          onClick={() => navigate('/')}
          className='mb-6 flex items-center text-gray-600 hover:text-gray-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded-lg px-2 py-1'
          aria-label='Go back to home page'>
          <ChevronLeft
            className='w-5 h-5 mr-2'
            aria-hidden='true'
          />
          Back to home
        </button>
        <Suspense
          fallback={<PageLoader message='Loading registration form...' />}>
          <RegisterForm
            onRegisterSuccess={onRegisterSuccess}
            switchToLogin={() => navigate('/login')}
          />
        </Suspense>
      </div>
    </main>
  );
};

const ForgotPasswordPage = ({ user, navigate }) => {
  if (user) {
    return (
      <Navigate
        to='/dashboard'
        replace
      />
    );
  }

  return (
    <main
      id='main-content'
      className='min-h-[calc(100vh-4rem)] bg-gray-50 flex items-center justify-center py-12 px-4'
      role='main'>
      <div className='max-w-md w-full'>
        <button
          onClick={() => navigate('/')}
          className='mb-6 flex items-center text-gray-600 hover:text-gray-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded-lg px-2 py-1'
          aria-label='Go back to home page'>
          <ChevronLeft
            className='w-5 h-5 mr-2'
            aria-hidden='true'
          />
          Back to home
        </button>
        <Suspense fallback={<PageLoader message='Loading...' />}>
          <ForgotPassword switchToLogin={() => navigate('/login')} />
        </Suspense>
      </div>
    </main>
  );
};

const ResetPasswordPage = ({ user }) => {
  if (user) {
    return (
      <Navigate
        to='/dashboard'
        replace
      />
    );
  }

  return (
    <main
      id='main-content'
      className='min-h-[calc(100vh-4rem)] bg-gray-50 flex items-center justify-center py-12 px-4'
      role='main'>
      <div className='max-w-md w-full'>
        <Suspense fallback={<PageLoader message='Loading...' />}>
          <ResetPassword />
        </Suspense>
      </div>
    </main>
  );
};

const ProtectedRoute = ({ user, authChecked, component }) => {
  // Show loading only for protected routes while auth is being checked
  if (!authChecked) {
    return <PageLoader message='Checking authentication...' />;
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

  // Memoized fetch user stats function
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

  // Check for existing user session on component mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await getCurrentUser();
        const userData = response?.data?.user || response?.user;
        if (userData) {
          setUser(userData);
          // If user is logged in and on auth pages, redirect to dashboard
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
        // User is not authenticated or session expired
        // If user is not authenticated and trying to access protected route, redirect to login
        if (
          location.pathname === '/dashboard' ||
          location.pathname === '/settings'
        ) {
          showToast.error('Session expired. Please sign in again.');
          navigate('/login');
        }
      } finally {
        setAuthChecked(true);
      }
    };

    checkAuthStatus();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Memoized auth success handler
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

  // Memoized logout handler
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

  // Memoized showAuth handler
  const showAuth = useCallback(() => navigate('/login'), [navigate]);

  // Memoized profile handler
  const handleShowProfile = useCallback(() => {
    fetchUserStats();
    setShowProfileModal(true);
  }, [fetchUserStats]);

  // Memoized close profile handler
  const handleCloseProfile = useCallback(() => setShowProfileModal(false), []);

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Skip Link for keyboard navigation */}
      <SkipLink targetId='main-content' />

      {/* Live region for screen reader announcements */}
      <LiveRegion
        message={announcement}
        politeness='polite'
      />

      <Navbar
        user={user}
        onLogout={handleLogout}
        onShowAuth={showAuth}
        onShowProfile={handleShowProfile}
      />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route
            path='/'
            element={
              <LandingPage
                onShowAuth={showAuth}
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
              />
            }
          />
          <Route
            path='/dashboard'
            element={
              <ProtectedRoute
                user={user}
                authChecked={authChecked}
                component={<Dashboard user={user} />}
              />
            }
          />
          <Route
            path='/settings'
            element={
              <ProtectedRoute
                user={user}
                authChecked={authChecked}
                component={<AccountSettings user={user} />}
              />
            }
          />
          <Route
            path='/privacy'
            element={<PrivacyPage />}
          />
          <Route
            path='/forgot-password'
            element={
              <ForgotPasswordPage
                user={user}
                navigate={navigate}
              />
            }
          />
          <Route
            path='/reset-password/:token'
            element={<ResetPasswordPage user={user} />}
          />
          <Route
            path='*'
            element={<NotFound />}
          />
        </Routes>
      </Suspense>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog {...confirmLogout} />

      {/* Profile Modal - Only render when user exists */}
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
