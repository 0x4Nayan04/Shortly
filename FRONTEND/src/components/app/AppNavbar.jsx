import { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Settings,
  User
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useFocusTrap } from '../Accessibility';
import { LandingFrameInner } from '../landing/LandingFrame';

const AppNavbar = memo(({ user, onLogout, onShowRegister, onShowProfile }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const goRegister = useCallback(() => {
    if (onShowRegister) {
      onShowRegister();
    } else {
      navigate('/register');
    }
  }, [navigate, onShowRegister]);
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
    onShowProfile?.();
    closeDropdown();
  }, [onShowProfile, closeDropdown]);

  const handleNavigateSettings = useCallback(() => {
    navigate('/settings');
    closeDropdown();
  }, [navigate, closeDropdown]);

  const handleLogoutClick = useCallback(() => {
    onLogout();
    closeDropdown();
  }, [onLogout, closeDropdown]);

  const handleDropdownKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      setIsDropdownOpen(false);
      dropdownButtonRef.current?.focus();
    }
  }, []);

  const accountLabel = user?.name || user?.email || 'Account';
  const firstName =
    user?.name?.trim().split(/\s+/)[0] || user?.email?.split('@')[0] || 'Account';
  const avatarInitial = (user?.name || user?.email || 'U')
    .charAt(0)
    .toUpperCase();

  const renderAvatar = () => (
    <span className='nav-user-avatar' aria-hidden='true'>
      <img
        src={user.avatar}
        alt=''
        width={28}
        height={28}
        onError={(e) => {
          e.target.style.display = 'none';
          e.target.nextElementSibling.style.display = 'flex';
        }}
      />
      <span className='nav-user-avatar-fallback'>{avatarInitial}</span>
    </span>
  );

  return (
    <header className='sticky top-0 z-50 h-[var(--nav-height)] border-b border-border bg-surface'>
      <LandingFrameInner className='!px-0 h-full'>
        <div className='landing-frame-px grid h-full grid-cols-[1fr_auto] items-center gap-4 md:grid-cols-[1fr_auto_1fr]'>
          <a
            href='/'
            onClick={goHome}
            className='nav-landing-logo justify-self-start outline-none'
            aria-label='Shortly — home'>
            <span
              className='flex h-7 w-7 items-center justify-center bg-primary text-white'
              aria-hidden='true'>
              <span className='font-display text-xs font-semibold'>S</span>
            </span>
            <span className='nav-landing-logo-text'>shortly</span>
          </a>

          <div
            className='hidden md:block'
            aria-hidden='true'
          />

          <div
            className='flex min-w-0 items-center justify-end gap-2 justify-self-end'
            role='navigation'
            aria-label='Account'>
            {user ? (
              <>
                <div
                  className='relative min-w-0'
                  ref={dropdownRef}>
                <button
                  type='button'
                  ref={dropdownButtonRef}
                  onClick={toggleDropdown}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown' && !isDropdownOpen) {
                      e.preventDefault();
                      setIsDropdownOpen(true);
                    }
                  }}
                  className='nav-user-trigger'
                  aria-expanded={isDropdownOpen}
                  aria-haspopup='true'
                  aria-controls='app-user-menu'
                  aria-label={`Account menu for ${accountLabel}`}>
                  {renderAvatar()}
                  <span className='nav-user-trigger-name'>{firstName}</span>
                  <ChevronDown
                    className='nav-user-trigger-chevron'
                    aria-hidden='true'
                  />
                </button>

                {isDropdownOpen && (
                  <div
                    ref={focusTrapRef}
                    id='app-user-menu'
                    role='menu'
                    aria-label='Account menu'
                    onKeyDown={handleDropdownKeyDown}
                    className='nav-user-menu animate-slide-down'>
                    <div className='nav-user-menu-identity'>
                      {user.name ? (
                        <p className='nav-user-menu-name'>{user.name}</p>
                      ) : null}
                      <p className='nav-user-menu-email'>{user.email}</p>
                    </div>

                    <p
                      className='nav-user-menu-section'
                      id='app-user-menu-section'>
                      Account
                    </p>

                    <div
                      className='nav-user-menu-list'
                      role='group'
                      aria-labelledby='app-user-menu-section'>
                      <button
                        type='button'
                        onClick={handleNavigateDashboard}
                        role='menuitem'
                        tabIndex={0}
                        className='nav-user-menu-row'>
                        <LayoutDashboard
                          className='nav-user-menu-row-icon'
                          aria-hidden='true'
                        />
                        <span className='nav-user-menu-row-label'>
                          Dashboard
                        </span>
                      </button>
                      <button
                        type='button'
                        onClick={handleShowProfileClick}
                        role='menuitem'
                        tabIndex={0}
                        className='nav-user-menu-row'>
                        <User
                          className='nav-user-menu-row-icon'
                          aria-hidden='true'
                        />
                        <span className='nav-user-menu-row-label'>
                          View profile
                        </span>
                      </button>
                      <button
                        type='button'
                        onClick={handleNavigateSettings}
                        role='menuitem'
                        tabIndex={0}
                        className='nav-user-menu-row'>
                        <Settings
                          className='nav-user-menu-row-icon'
                          aria-hidden='true'
                        />
                        <span className='nav-user-menu-row-label'>
                          Settings
                        </span>
                      </button>
                    </div>

                    <div
                      className='nav-user-menu-footer'
                      role='group'
                      aria-label='Session'>
                      <button
                        type='button'
                        onClick={handleLogoutClick}
                        role='menuitem'
                        tabIndex={0}
                        className='nav-user-menu-row nav-user-menu-row--danger'>
                        <LogOut
                          className='nav-user-menu-row-icon'
                          aria-hidden='true'
                        />
                        <span className='nav-user-menu-row-label'>
                          Sign out
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              </>
            ) : pathname === '/login' ? (
              <button
                type='button'
                onClick={goRegister}
                className='sm-btn sm-btn-primary'>
                Sign up
              </button>
            ) : pathname === '/register' ? (
              <button
                type='button'
                onClick={() => navigate('/login')}
                className='sm-btn sm-btn-primary'>
                Sign in
              </button>
            ) : (
              <>
                <button
                  type='button'
                  onClick={() => navigate('/login')}
                  className='sm-btn sm-btn-secondary hidden sm:inline-flex'>
                  Sign in
                </button>
                <button
                  type='button'
                  onClick={goRegister}
                  className='sm-btn sm-btn-primary'>
                  Sign up
                </button>
              </>
            )}
          </div>
        </div>
      </LandingFrameInner>
    </header>
  );
});

AppNavbar.displayName = 'AppNavbar';

export default AppNavbar;
