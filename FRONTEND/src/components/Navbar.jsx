import { useEffect, useRef, useState, memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFocusTrap } from './Accessibility';

const Navbar = memo(({ user, onLogout, onShowAuth, onShowProfile }) => {
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
      className='bg-white/90 backdrop-blur-xl border-b border-gray-200/80 sticky top-0 z-50 shadow-sm'
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
            className='flex items-center shrink-0 group transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded-lg'
            aria-label='Shortly - Go to homepage'>
            <h1 className='text-xl sm:text-2xl font-bold text-gray-900 tracking-tight group-hover:text-indigo-600 transition-colors duration-200'>
              Short<span className='text-indigo-600'>ly</span>
            </h1>
          </a>

          <div className='flex items-center gap-2 sm:gap-4'>
            {user ? (
              <div
                className='relative'
                ref={dropdownRef}>
                <button
                  ref={dropdownButtonRef}
                  onClick={toggleDropdown}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown' && !isDropdownOpen) {
                      e.preventDefault();
                      setIsDropdownOpen(true);
                    }
                  }}
                  className={`flex items-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl pl-2 pr-3 py-2 sm:px-4 sm:py-2.5 transition-all duration-200 group focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
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
                      aria-hidden='true'
                      className='w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover ring-2 ring-gray-200'
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
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
                  <svg
                    className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${
                      isDropdownOpen ? 'rotate-180' : ''
                    }`}
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                    aria-hidden='true'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M19 9l-7 7-7-7'
                    />
                  </svg>
                </button>

                {isDropdownOpen && (
                  <div
                    ref={focusTrapRef}
                    id='user-menu'
                    role='group'
                    aria-label='User menu'
                    onKeyDown={handleDropdownKeyDown}
                    className='absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 animate-slide-down'>
                    <div className='px-4 py-3 border-b border-gray-100'>
                      <div className='flex items-center gap-3'>
                        <div className='relative shrink-0'>
                          <img
                            src={user.avatar}
                            alt=''
                            aria-hidden='true'
                            className='w-11 h-11 rounded-full object-cover ring-2 ring-gray-200'
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
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
                        tabIndex={0}
                        className='flex items-center w-full gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg mx-1 group focus:outline-none focus:bg-indigo-50 focus:text-indigo-700'>
                        <div
                          className='w-5 h-5 text-gray-400 group-hover:text-indigo-500 group-focus:text-indigo-500 shrink-0'
                          aria-hidden='true'>
                          <svg
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'>
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z'
                            />
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z'
                            />
                          </svg>
                        </div>
                        Dashboard
                      </button>

                      <button
                        onClick={handleShowProfileClick}
                        tabIndex={0}
                        className='flex items-center w-full gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg mx-1 group focus:outline-none focus:bg-indigo-50 focus:text-indigo-700'>
                        <div
                          className='w-5 h-5 text-gray-400 group-hover:text-indigo-500 group-focus:text-indigo-500 shrink-0'
                          aria-hidden='true'>
                          <svg
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'>
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                            />
                          </svg>
                        </div>
                        View Profile
                      </button>

                      <button
                        onClick={handleNavigateSettings}
                        tabIndex={0}
                        className='flex items-center w-full gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg mx-1 group focus:outline-none focus:bg-indigo-50 focus:text-indigo-700'>
                        <div
                          className='w-5 h-5 text-gray-400 group-hover:text-indigo-500 group-focus:text-indigo-500 shrink-0'
                          aria-hidden='true'>
                          <svg
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'>
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
                            />
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                            />
                          </svg>
                        </div>
                        Settings
                      </button>
                    </div>

                    <div className='border-t border-gray-100 pt-1 mt-1'>
                      <button
                        onClick={handleLogoutClick}
                        tabIndex={0}
                        className='flex items-center w-full gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg mx-1 group focus:outline-none focus:bg-red-50 focus:text-red-700'>
                        <div
                          className='w-5 h-5 text-red-500 shrink-0'
                          aria-hidden='true'>
                          <svg
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'>
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1'
                            />
                          </svg>
                        </div>
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className='flex items-center gap-2 sm:gap-3'>
                <button
                  onClick={handleNavigateLogin}
                  className='px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2'>
                  Login
                </button>
                <button
                  onClick={handleNavigateRegister}
                  className='px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2'>
                  Sign up
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
