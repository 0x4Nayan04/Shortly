/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  lazy,
  Suspense,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useUrlStats } from '../hooks/useUrlStats';
import { getCurrentUser, logoutUser } from '../api/user.api';
import { useAnnouncement } from '../components/Accessibility';
import { ConfirmDialog, useConfirmDialog } from '../components/UxEnhancements';
import { showToast } from '../utils/showToast';
import { ROUTES } from '../constants/routes';
import { getApiPayload } from '../utils/axiosInstance';
import { claimStoredAnonymousLinks } from '../utils/claimAnonymousLinks';
import {
  clearAuthSessionUser,
  getAuthSessionServerSnapshot,
  getAuthSessionSnapshot,
  refreshAuthSessionUser,
  retryAuthSessionBootstrap,
  setAuthSessionUser,
  subscribeAuthSession
} from './authSessionStore';

const UserProfileModal = lazy(() => import('../components/UserProfileModal'));

const PROFILE_LOAD_ERROR =
  'Signed in but could not load your profile. Please try again.';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { user, authChecked, authError } = useSyncExternalStore(
    subscribeAuthSession,
    getAuthSessionSnapshot,
    getAuthSessionServerSnapshot
  );
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [announcement, announce] = useAnnouncement();
  const confirmLogout = useConfirmDialog();
  const navigate = useNavigate();

  const {
    stats,
    loading: statsFetchLoading,
    hasFetched: statsHasFetched,
    refetch: refetchStats,
    reset: resetStats
  } = useUrlStats();

  const statsLoading = Boolean(
    user?._id && (statsFetchLoading || !statsHasFetched)
  );

  useEffect(() => {
    if (user?._id) {
      refetchStats();
    } else {
      resetStats();
    }
  }, [user?._id, refetchStats, resetStats]);

  useEffect(() => {
    const handler = (event) => {
      showToast.error('Session expired. Please sign in again.');
      clearAuthSessionUser();
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
    async (response, { returnTo } = {}) => {
      let userData = getApiPayload(response)?.user;
      if (!userData) {
        try {
          const current = await getCurrentUser();
          userData = getApiPayload(current)?.user;
        } catch {
          userData = null;
        }
        if (!userData) {
          showToast.error(PROFILE_LOAD_ERROR);
          return;
        }
      }
      setAuthSessionUser(userData);

      const claimResult = await claimStoredAnonymousLinks();
      if (claimResult.claimed.length > 0) {
        await refetchStats();
        showToast.success(
          `Added ${claimResult.claimed.length} anonymous link${claimResult.claimed.length === 1 ? '' : 's'} to your dashboard`
        );
      }

      const destination = returnTo ?? ROUTES.DASHBOARD;
      showToast.success('Welcome back!');
      announce(
        returnTo
          ? 'Returning to your previous page.'
          : 'Redirecting to dashboard.'
      );
      navigate(destination);
    },
    [navigate, announce, refetchStats]
  );

  const updateUser = useCallback((updatedUser) => {
    const current = getAuthSessionSnapshot().user;
    setAuthSessionUser(
      current && updatedUser ? { ...current, ...updatedUser } : updatedUser
    );
  }, []);

  const refreshUser = useCallback(() => refreshAuthSessionUser(), []);

  const retryAuthCheck = useCallback(() => retryAuthSessionBootstrap(), []);

  const handleAccountDeleted = useCallback(() => {
    clearAuthSessionUser();
    navigate(ROUTES.HOME);
  }, [navigate]);

  const logout = useCallback(async () => {
    const confirmed = await confirmLogout.confirm({
      title: 'Sign out everywhere',
      message:
        'This signs you out on this device and any other devices using your account. You will need to sign in again to manage your links.',
      confirmLabel: 'Sign out everywhere',
      cancelLabel: 'Cancel',
      variant: 'danger'
    });

    if (!confirmed) return;

    const loggedOut = await logoutUser()
      .then(() => true)
      .catch(() => false);
    if (loggedOut) {
      showToast.success('You have been signed out everywhere.');
    }
    clearAuthSessionUser();
    announce('You have been signed out everywhere.');
    navigate(ROUTES.HOME);
  }, [navigate, announce, confirmLogout]);

  const openLogin = useCallback(() => navigate(ROUTES.LOGIN), [navigate]);

  const openRegister = useCallback(() => navigate(ROUTES.REGISTER), [navigate]);

  const openProfile = useCallback(() => {
    refetchStats();
    setShowProfileModal(true);
  }, [refetchStats]);

  const closeProfile = useCallback(() => setShowProfileModal(false), []);

  const value = useMemo(
    () => ({
      user,
      authChecked,
      authError,
      stats,
      statsLoading,
      refetchStats,
      login,
      logout,
      updateUser,
      refreshUser,
      retryAuthCheck,
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
      authError,
      stats,
      statsLoading,
      refetchStats,
      login,
      logout,
      updateUser,
      refreshUser,
      retryAuthCheck,
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
            userStats={stats?.stats}
          />
        </Suspense>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = use(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
