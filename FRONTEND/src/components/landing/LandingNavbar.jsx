import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, LogOut, Menu, X } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useFocusTrap } from '../Accessibility';
import ShortlyLogo from '../ShortlyLogo';
import { LandingFrameInner } from './LandingFrame';

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Privacy', to: '/privacy' }
];

const LandingNavbar = memo(({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const mobileMenuRef = useFocusTrap(isMobileMenuOpen, {
    onEscape: () => setIsMobileMenuOpen(false)
  });

  const goHome = useCallback(
    (e) => {
      e.preventDefault();
      navigate('/');
    },
    [navigate]
  );

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const closeOnResize = () => {
      if (window.innerWidth >= 768) setIsMobileMenuOpen(false);
    };
    window.addEventListener('resize', closeOnResize);
    return () => window.removeEventListener('resize', closeOnResize);
  }, [isMobileMenuOpen]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname, location.hash]);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
    menuButtonRef.current?.focus();
  }, []);

  const handleMobileNavClick = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  return (
    <header className='sticky top-0 z-50 h-[var(--nav-height)] border-b border-border bg-surface'>
      <LandingFrameInner className='!px-0 h-full'>
        <div className='landing-frame-px grid h-full grid-cols-[1fr_auto] items-center gap-3 md:grid-cols-[1fr_auto_1fr] md:gap-4'>
          <a
            href='/'
            onClick={goHome}
            className='nav-landing-logo justify-self-start outline-none'
            aria-label='Shortly — home'>
            <ShortlyLogo className='shortly-logo--header' />
          </a>

          <nav
            className='hidden items-center md:flex justify-self-center'
            aria-label='Page sections'>
            {NAV_LINKS.map((item) =>
              item.to ? (
                <Link
                  key={item.label}
                  to={item.to}
                  className='nav-landing-link px-3.5 py-2 outline-none'>
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.label}
                  href={item.href}
                  className='nav-landing-link px-3.5 py-2 outline-none'>
                  {item.label}
                </a>
              )
            )}
          </nav>

          <div
            className='flex items-center justify-end gap-2 justify-self-end'
            role='navigation'
            aria-label='Account'>
            {user ? (
              <>
                <button
                  type='button'
                  onClick={() => navigate('/dashboard')}
                  className='sm-btn sm-btn-primary sm-btn-split hidden sm:inline-flex'>
                  <span className='sm-btn-split-label'>Dashboard</span>
                  <span className='sm-btn-split-icon'>
                    <ArrowRight
                      className='h-3.5 w-3.5'
                      aria-hidden='true'
                    />
                  </span>
                </button>
                <button
                  type='button'
                  onClick={onLogout}
                  className='sm-btn sm-btn-secondary hidden sm:inline-flex items-center gap-1.5'>
                  <LogOut
                    className='h-3.5 w-3.5'
                    aria-hidden='true'
                  />
                  <span>Sign out</span>
                </button>
              </>
            ) : (
              <button
                type='button'
                onClick={() => navigate('/login')}
                className='sm-btn sm-btn-primary sm-btn-split hidden sm:inline-flex'>
                <span className='sm-btn-split-label'>Sign in</span>
                <span className='sm-btn-split-icon'>
                  <ArrowRight
                    className='h-3.5 w-3.5'
                    aria-hidden='true'
                  />
                </span>
              </button>
            )}
            <button
              type='button'
              ref={menuButtonRef}
              className='landing-mobile-menu-btn md:hidden'
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
              aria-controls='landing-mobile-menu'
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}>
              {isMobileMenuOpen ? (
                <X
                  className='h-4 w-4'
                  aria-hidden='true'
                />
              ) : (
                <Menu
                  className='h-4 w-4'
                  aria-hidden='true'
                />
              )}
            </button>
          </div>
        </div>
      </LandingFrameInner>
      {isMobileMenuOpen ? (
        <div
          className='landing-mobile-menu-overlay md:hidden'
          onClick={closeMobileMenu}>
          <div
            id='landing-mobile-menu'
            className='landing-mobile-menu-panel'
            ref={mobileMenuRef}
            role='dialog'
            aria-modal='true'
            aria-label='Site navigation'
            onClick={(e) => e.stopPropagation()}>
            <nav
              className='landing-mobile-menu-links'
              aria-label='Page sections'>
              {NAV_LINKS.map((item) =>
                item.to ? (
                  <Link
                    key={item.label}
                    to={item.to}
                    className='landing-mobile-menu-link'
                    onClick={handleMobileNavClick}>
                    {item.label}
                  </Link>
                ) : (
                  <a
                    key={item.label}
                    href={item.href}
                    className='landing-mobile-menu-link'
                    onClick={handleMobileNavClick}>
                    {item.label}
                  </a>
                )
              )}
            </nav>
            <div className='landing-mobile-menu-actions'>
              {user ? (
                <>
                  <button
                    type='button'
                    onClick={() => {
                      navigate('/dashboard');
                      handleMobileNavClick();
                    }}
                    className='sm-btn sm-btn-primary w-full'>
                    Dashboard
                  </button>
                  <button
                    type='button'
                    onClick={() => {
                      onLogout();
                      handleMobileNavClick();
                    }}
                    className='sm-btn sm-btn-secondary w-full inline-flex items-center justify-center gap-1.5'>
                    <LogOut
                      className='h-3.5 w-3.5'
                      aria-hidden='true'
                    />
                    <span>Sign out</span>
                  </button>
                </>
              ) : (
                <button
                  type='button'
                  onClick={() => {
                    navigate('/login');
                    handleMobileNavClick();
                  }}
                  className='sm-btn sm-btn-primary w-full inline-flex items-center justify-center gap-1.5'>
                  <span>Sign in</span>
                  <ArrowRight
                    className='h-3.5 w-3.5'
                    aria-hidden='true'
                  />
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
});

LandingNavbar.displayName = 'LandingNavbar';

export default LandingNavbar;
