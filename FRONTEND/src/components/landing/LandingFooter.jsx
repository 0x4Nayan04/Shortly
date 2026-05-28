import { Link } from 'react-router-dom';
import { SOCIAL_LINKS } from '../../constants/social';
import { LandingFrameInner } from './LandingFrame';

const GithubIcon = ({ className }) => (
  <svg
    className={className}
    viewBox='0 0 24 24'
    fill='currentColor'
    aria-hidden='true'>
    <path d='M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z' />
  </svg>
);

const XIcon = ({ className }) => (
  <svg
    className={className}
    viewBox='0 0 24 24'
    fill='currentColor'
    aria-hidden='true'>
    <path d='M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' />
  </svg>
);

const FOOTER_COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Shorten', to: '/' },
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Privacy', to: '/privacy' }
    ]
  },
  {
    title: 'Connect',
    links: [
      { label: 'GitHub', href: SOCIAL_LINKS.github, external: true },
      { label: 'X / Twitter', href: SOCIAL_LINKS.twitter, external: true }
    ]
  }
];

const LandingFooter = () => {
  const year = new Date().getFullYear();

  return (
    <footer className='bg-surface'>
      <LandingFrameInner className='landing-footer-inner'>
        <div className='landing-footer-grid'>
          <div className='landing-footer-brand'>
            <div className='nav-landing-logo w-fit'>
              <span
                className='flex h-7 w-7 items-center justify-center bg-primary text-white'
                aria-hidden='true'>
                <span className='font-display text-xs font-semibold'>S</span>
              </span>
              <span className='nav-landing-logo-text'>shortly</span>
            </div>
            <p className='landing-section-lead max-w-sm'>
              Short links for everything you share. Built for speed, clarity,
              and optional analytics when you sign in.
            </p>
            <div className='flex gap-2'>
              <a
                href={SOCIAL_LINKS.github}
                target='_blank'
                rel='noopener noreferrer'
                className='landing-icon-btn outline-none'
                aria-label='GitHub'>
                <GithubIcon className='h-4 w-4' />
              </a>
              <a
                href={SOCIAL_LINKS.twitter}
                target='_blank'
                rel='noopener noreferrer'
                className='landing-icon-btn outline-none'
                aria-label='X (Twitter)'>
                <XIcon className='h-3.5 w-3.5' />
              </a>
            </div>
          </div>

          {FOOTER_COLUMNS.map((col) => (
            <nav
              key={col.title}
              className='landing-footer-nav'
              aria-label={col.title}>
              <p className='landing-footer-heading'>
                {col.title}
              </p>
              <ul className='landing-footer-links'>
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='landing-text-link outline-none'>
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        to={link.to}
                        className='landing-text-link outline-none'>
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </LandingFrameInner>

      <div className='landing-footer-bar landing-frame-px'>
        <span className='text-ink/80'>© {year} Shortly · Nayan</span>
        <span className='tabular-nums text-muted'>shortly.nayan04.me</span>
      </div>
    </footer>
  );
};

export default LandingFooter;
