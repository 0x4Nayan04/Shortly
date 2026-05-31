import {
  createContext,
  lazy,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getUrlStats } from '../api/shortUrl.api';
import { getCurrentUser, logoutUser } from '../api/user.api';
import { useAnnouncement } from '../components/Accessibility';
import {
  ConfirmDialog,
  showToast,
  useConfirmDialog
} from '../components/UxEnhancements';
import { ROUTES } from '../constants/routes';
import { getApiPayload } from '../utils/axiosInstance';
import { claimStoredAnonymousLinks } from '../utils/claimAnonymousLinks';

const UserProfileModal = lazy(() => import('../components/UserProfileModal'));

const PROTECTED_ROUTE_PRELOADS = {
  [ROUTES.DASHBOARD]: () => import('../components/Dashboard'),
  [ROUTES.SETTINGS]: () => import('../components/AccountSettings')
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
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
      const payload = getApiPayload(response);
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
    let cancelled = false;
    const routePreload =
      PROTECTED_ROUTE_PRELOADS[location.pathname]?.() ?? Promise.resolve();

    const checkAuthStatus = async () => {
      try {
        const response = await getCurrentUser();
        const userData = getApiPayload(response)?.user;
        if (cancelled) return;
        if (userData) {
          setUser(userData);
          await claimStoredAnonymousLinks();
        }
      } catch {
        // ProtectedLayout redirects once authChecked is true and user is absent.
      } finally {
        await routePreload;
        if (!cancelled) {
          setAuthChecked(true);
        }
      }
    };

    checkAuthStatus();
    return () => {
      cancelled = true;
    };
    // Initial session check only — route layouts own redirects after authChecked.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handler = (event) => {
      showToast.error('Session expired. Please sign in again.');
      setUser(null);
      const returnTo = event.detail?.returnTo;
      if (returnTo) {
        navigate(`${ROUTES.LOGIN}?returnTo=${returnTo}`, { replace: true });
      } else {
        navigate(ROUTES.LOGIN, { replace: true });
      }
    };
    window.addEventListener('auth:expired', handler);
    return () => window.removeEventListener('auth:expired', handler);
  }, [navigate]);

  const login = useCallback(
    async (response) => {
      const userData = getApiPayload(response)?.user;
      if (userData) {
        setUser(userData);
      } else {
        try {
          const current = await getCurrentUser();
          const currentUser = getApiPayload(current)?.user;
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

      const claimResult = await claimStoredAnonymousLinks();
      if (claimResult.claimed.length > 0) {
        showToast.success(
          `Added ${claimResult.claimed.length} anonymous link${claimResult.claimed.length === 1 ? '' : 's'} to your dashboard`
        );
      }

      announce('Successfully signed in. Redirecting to dashboard.');
      showToast.success('Welcome back! You have been signed in.');
      navigate(ROUTES.DASHBOARD);
    },
    [navigate, announce]
  );

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
  }, []);

  const handleAccountDeleted = useCallback(() => {
    setUser(null);
    navigate(ROUTES.HOME);
  }, [navigate]);

  const logout = useCallback(async () => {
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
      navigate(ROUTES.HOME);
    }
  }, [navigate, announce, confirmLogout]);

  const openLogin = useCallback(() => navigate(ROUTES.LOGIN), [navigate]);

  const openRegister = useCallback(() => navigate(ROUTES.REGISTER), [navigate]);

  const openProfile = useCallback(() => {
    fetchUserStats();
    setShowProfileModal(true);
  }, [fetchUserStats]);

  const closeProfile = useCallback(() => setShowProfileModal(false), []);

  const value = useMemo(
    () => ({
      user,
      authChecked,
      login,
      logout,
      updateUser,
      handleAccountDeleted,
      openLogin,
      openRegister,
      openProfile,
      closeProfile,
      announcement
    }),
    [
      user,
      authChecked,
      login,
      logout,
      updateUser,
      handleAccountDeleted,
      openLogin,
      openRegister,
      openProfile,
      closeProfile,
      announcement
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <ConfirmDialog {...confirmLogout} />
      {user && showProfileModal && (
        <Suspense fallback={null}>
          <UserProfileModal
            isOpen={showProfileModal}
            onClose={closeProfile}
            user={user}
            userStats={userStats}
          />
        </Suspense>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
