import { useEffect, useRef, useState, memo, useCallback } from 'react';
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Settings,
  User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFocusTrap } from './Accessibility';

const Navbar = memo(({ user, onLogout, onShowProfile }) => {
  const navigate = useNavigate();
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
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = useCallback(() => {
    setIsDropdownOpen((prev) => !prev);
  }, []);

  const handleNavigateHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleNavigateDashboard = useCallback(() => {
    navigate('/dashboard');
    setIsDropdownOpen(false);
  }, [navigate]);

  const handleShowProfileClick = useCallback(() => {
    if (onShowProfile) onShowProfile();
    setIsDropdownOpen(false);
  }, [onShowProfile]);

  const handleNavigateSettings = useCallback(() => {
    navigate('/settings');
    setIsDropdownOpen(false);
  }, [navigate]);

  const handleLogoutClick = useCallback(() => {
    onLogout();
    setIsDropdownOpen(false);
  }, [onLogout]);

  const handleNavigateLogin = useCallback(() => {
    navigate('/login');
  }, [navigate]);

  const handleNavigateRegister = useCallback(() => {
    navigate('/register');
  }, [navigate]);

  const handleDropdownKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      setIsDropdownOpen(false);
      dropdownButtonRef.current?.focus();
    }
  }, []);

  return (
    <nav
      className='bg-white/90 backdrop-blur-xl border-b border-gray-200/80 sticky top-0 z-50 shadow-sm touch-action-manipulation'
      role='navigation'
      aria-label='Main navigation'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center h-16'>
          <a
            href='/'
            onClick={(e) => {
              e.preventDefault();
              handleNavigateHome();
            }}
            className='flex items-center shrink-0 group transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded-lg px-2 py-1 -ml-2'
            aria-label='Shortly—Go to homepage'>
            <h1 className='text-xl sm:text-2xl font-bold tracking-tight'>
              <span className='text-gray-900 group-hover:text-gray-700 transition-colors'>
                Short
              </span>
              <span className='text-indigo-600 group-hover:text-indigo-500 transition-colors'>
                ly
              </span>
            </h1>
          </a>

          <div className='flex items-center gap-2 sm:gap-4'>
            {user ? (
              <div
                className='relative'
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
                  className={`flex items-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl pl-2 pr-3 py-2 sm:px-4 sm:py-2.5 transition-colors group focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
                    isDropdownOpen ? 'bg-indigo-50' : 'hover:bg-gray-100'
                  }`}
                  aria-expanded={isDropdownOpen}
                  aria-haspopup='true'
                  aria-controls='user-menu'
                  aria-label={`User menu for ${user.name || user.email}`}>
                  <div className='relative shrink-0'>
                    <img
                      src={user.avatar}
                      alt=''
                      width='36'
                      height='36'
                      aria-hidden='true'
                      className='w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover ring-2 ring-gray-200'
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextElementSibling.style.display = 'flex';
                      }}
                    />
                    <div
                      className='w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center ring-2 ring-gray-200'
                      style={{ display: 'none' }}
                      aria-hidden='true'>
                      <span className='text-sm font-semibold text-indigo-700'>
                        {(user.name || user.email || 'U')
                          .charAt(0)
                          .toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className='hidden md:block text-left min-w-0 max-w-[140px] lg:max-w-[180px]'>
                    <div className='text-sm font-medium text-gray-900 truncate'>
                      {user.name || 'Account'}
                    </div>
                    <div className='text-xs text-gray-500 truncate'>
                      {user.email}
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${
                      isDropdownOpen ? 'rotate-180' : ''
                    }`}
                    aria-hidden='true'
                  />
                </button>

                {isDropdownOpen && (
                  <div
                    ref={focusTrapRef}
                    id='user-menu'
                    role='menu'
                    aria-label='User menu'
                    onKeyDown={handleDropdownKeyDown}
                    className='absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 animate-slide-down overscroll-contain'>
                    <div className='px-4 py-3 border-b border-gray-100'>
                      <div className='flex items-center gap-3'>
                        <div className='relative shrink-0'>
                          <img
                            src={user.avatar}
                            alt=''
                            width='44'
                            height='44'
                            aria-hidden='true'
                            className='w-11 h-11 rounded-full object-cover ring-2 ring-gray-200'
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextElementSibling.style.display =
                                'flex';
                            }}
                          />
                          <div
                            className='w-11 h-11 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center ring-2 ring-gray-200'
                            style={{ display: 'none' }}
                            aria-hidden='true'>
                            <span className='text-sm font-semibold text-indigo-700'>
                              {(user.name || user.email || 'U')
                                .charAt(0)
                                .toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className='flex-1 min-w-0'>
                          <div className='text-sm font-medium text-gray-900 truncate'>
                            {user.name || 'Account'}
                          </div>
                          <div className='text-xs text-gray-500 truncate mt-0.5'>
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className='py-1'>
                      <button
                        onClick={handleNavigateDashboard}
                        role='menuitem'
                        tabIndex={0}
                        className='flex items-center w-full gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 rounded-lg mx-1 group transition-colors focus:outline-none focus-visible:bg-indigo-50 focus-visible:text-indigo-700'>
                        <LayoutDashboard
                          className='w-5 h-5 text-gray-400 group-hover:text-indigo-500 group-focus-visible:text-indigo-600 shrink-0 transition-colors'
                          aria-hidden='true'
                        />
                        Dashboard
                      </button>

                      <button
                        onClick={handleShowProfileClick}
                        role='menuitem'
                        tabIndex={0}
                        className='flex items-center w-full gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 rounded-lg mx-1 group transition-colors focus:outline-none focus-visible:bg-indigo-50 focus-visible:text-indigo-700'>
                        <User
                          className='w-5 h-5 text-gray-400 group-hover:text-indigo-500 group-focus-visible:text-indigo-600 shrink-0 transition-colors'
                          aria-hidden='true'
                        />
                        View Profile
                      </button>

                      <button
                        onClick={handleNavigateSettings}
                        role='menuitem'
                        tabIndex={0}
                        className='flex items-center w-full gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 rounded-lg mx-1 group transition-colors focus:outline-none focus-visible:bg-indigo-50 focus-visible:text-indigo-700'>
                        <Settings
                          className='w-5 h-5 text-gray-400 group-hover:text-indigo-500 group-focus-visible:text-indigo-600 shrink-0 transition-colors'
                          aria-hidden='true'
                        />
                        Settings
                      </button>
                    </div>

                    <div className='border-t border-gray-100 pt-1 mt-1'>
                      <button
                        onClick={handleLogoutClick}
                        role='menuitem'
                        tabIndex={0}
                        className='flex items-center w-full gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 active:bg-red-100 rounded-lg mx-1 group transition-colors focus:outline-none focus-visible:bg-red-50 focus-visible:text-red-700'>
                        <LogOut
                          className='w-5 h-5 text-red-500 shrink-0 transition-colors'
                          aria-hidden='true'
                        />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className='flex items-center gap-2 sm:gap-3'>
                <button
                  onClick={handleNavigateLogin}
                  className='px-3 py-2 sm:px-4 rounded-lg text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 whitespace-nowrap'>
                  Sign In
                </button>
                <button
                  onClick={handleNavigateRegister}
                  className='px-3 py-2 sm:px-4 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 whitespace-nowrap'>
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
});

Navbar.displayName = 'Navbar';

export default Navbar;
