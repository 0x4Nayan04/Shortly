import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useFocusTrap } from '../Accessibility';
import ShortlyLogo from '../ShortlyLogo';
import { LandingFrameInner } from '../landing/LandingFrameInner';
import UserDropdown from './UserDropdown';
import { ROUTES } from '../../constants/routes';
import { isAdminUser } from '../../utils/isAdmin';

const GuestNav = ({ pathname, onRegister, onLogin }) => {
  if (pathname === '/login') {
    return (
      <button
        type="button"
        onClick={onRegister}
        className="sm-btn sm-btn-primary"
      >
        Sign up
      </button>
    );
  }

  if (pathname === '/register') {
    return (
      <button type="button" onClick={onLogin} className="sm-btn sm-btn-primary">
        Sign in
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={onLogin}
        className="sm-btn sm-btn-secondary hidden sm:inline-flex"
      >
        Sign in
      </button>
      <button
        type="button"
        onClick={onRegister}
        className="sm-btn sm-btn-primary"
      >
        Sign up
      </button>
    </>
  );
};

const AppNavbar = memo(() => {
  const { user, logout, openRegister, openProfile } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const dropdownButtonRef = useRef(null);

  const focusTrapRef = useFocusTrap(isDropdownOpen, {
    onEscape: () => setIsDropdownOpen(false),
    restoreFocus: true
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const goHome = useCallback(
    (e) => {
      e.preventDefault();
      navigate('/');
    },
    [navigate]
  );

  const toggleDropdown = useCallback(() => {
    setIsDropdownOpen((prev) => !prev);
  }, []);

  const closeDropdown = useCallback(() => setIsDropdownOpen(false), []);

  const handleNavigateDashboard = useCallback(() => {
    navigate('/dashboard');
    closeDropdown();
  }, [navigate, closeDropdown]);

  const handleShowProfileClick = useCallback(() => {
    openProfile();
    closeDropdown();
  }, [openProfile, closeDropdown]);

  const handleNavigateSettings = useCallback(() => {
    navigate('/settings');
    closeDropdown();
  }, [navigate, closeDropdown]);

  const handleNavigateAbuseQueue = useCallback(() => {
    navigate(ROUTES.ADMIN_ABUSE);
    closeDropdown();
  }, [navigate, closeDropdown]);

  const handleLogoutClick = useCallback(() => {
    logout();
    closeDropdown();
  }, [logout, closeDropdown]);

  const handleDropdownKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      setIsDropdownOpen(false);
      dropdownButtonRef.current?.focus();
    }
  }, []);

  return (
    <header className="sticky top-0 z-50 h-[var(--nav-height)] border-b border-border bg-surface">
      <LandingFrameInner className="!px-0 h-full">
        <div className="landing-frame-px grid h-full grid-cols-[1fr_auto] items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
          <a
            href="/"
            onClick={goHome}
            className="nav-landing-logo justify-self-start outline-none"
            aria-label="Shortly — home"
          >
            <ShortlyLogo className="shortly-logo--header" />
          </a>

          <div className="hidden md:block" aria-hidden="true" />

          <nav
            className="flex min-w-0 items-center justify-end gap-2 justify-self-end"
            aria-label="Account"
          >
            {user ? (
              <div ref={dropdownRef}>
                <UserDropdown
                  user={user}
                  isAdmin={isAdminUser(user.email)}
                  isDropdownOpen={isDropdownOpen}
                  setIsDropdownOpen={setIsDropdownOpen}
                  dropdownButtonRef={dropdownButtonRef}
                  focusTrapRef={focusTrapRef}
                  toggleDropdown={toggleDropdown}
                  handleDropdownKeyDown={handleDropdownKeyDown}
                  handleNavigateDashboard={handleNavigateDashboard}
                  handleShowProfileClick={handleShowProfileClick}
                  handleNavigateSettings={handleNavigateSettings}
                  handleNavigateAbuseQueue={handleNavigateAbuseQueue}
                  handleLogoutClick={handleLogoutClick}
                />
              </div>
            ) : (
              <GuestNav
                pathname={pathname}
                onRegister={openRegister}
                onLogin={() => navigate('/login')}
              />
            )}
          </nav>
        </div>
      </LandingFrameInner>
    </header>
  );
});

AppNavbar.displayName = 'AppNavbar';

export default AppNavbar;
