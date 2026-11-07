import { createElement } from 'react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LANDING_SECTION_LINKS, LANDING_INFO_LINKS } from '../../constants/landingNav';
import { ROUTES } from '../../constants/routes';
import { SOCIAL_LINKS } from '../../constants/social';
import { useAuthSession } from '../../contexts/AuthContext';
import ShortlyLogo from '../ShortlyLogo';
import { XBrandIcon } from '../ShareBrandIcons';
import { LandingFrameInner } from './LandingFrameInner';

const FooterInlineLink = ({ link }) => {
  const className = 'nav-landing-link landing-footer-link outline-none';

  if (link.href) {
    return (
      <a
        href={link.href}
        className={className}
        {...(link.external
          ? { target: '_blank', rel: 'noopener noreferrer' }
          : {})}
      >
        {link.label}
      </a>
    );
  }

  return (
    <Link to={link.to} className={className}>
      {link.label}
    </Link>
  );
};

const getFooterLinks = (user) => [
  ...LANDING_SECTION_LINKS.map((link) => ({
    ...link,
    href: `${ROUTES.HOME}${link.href}`
  })),
  ...LANDING_INFO_LINKS,
  user
    ? { label: 'Dashboard', to: ROUTES.DASHBOARD }
    : { label: 'Sign in', to: ROUTES.LOGIN }
];

const SOCIAL_ICON_LINKS = [
  {
    label: 'GitHub',
    href: SOCIAL_LINKS.github,
    icon: GitHubBrandIcon
  },
  {
    label: 'X',
    href: SOCIAL_LINKS.twitter,
    icon: XBrandIcon
  }
];

function GitHubBrandIcon({ className, ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

const LandingFooter = () => {
  const { user } = useAuthSession();
  const footerLinks = getFooterLinks(user);

  return (
    <footer className="landing-footer" aria-labelledby="footer-heading">
      <LandingFrameInner className="landing-footer-inner">
        <div className="landing-footer-main">
          <div className="landing-footer-invitation">
            <h2 id="footer-heading">Keep it short.</h2>
            <p className="landing-footer-description">
              Less URL. More room for what matters.
            </p>
            <a href={`${ROUTES.HOME}#main-content`} className="landing-footer-cta">
              <span>Shorten a link</span>
              <span className="landing-footer-cta-arrow">
                <ArrowRight size={18} aria-hidden="true" />
              </span>
            </a>
          </div>

          <nav className="landing-footer-inline-nav" aria-label="Footer">
            <h3 className="landing-footer-group-title">Explore</h3>
            <ul className="landing-footer-inline-links">
              {footerLinks.map((link) => (
                <li key={link.label}>
                  <FooterInlineLink link={link} />
                </li>
              ))}
            </ul>
          </nav>
          <div className="landing-footer-social" role="group" aria-labelledby="footer-social-heading">
            <h3 id="footer-social-heading" className="landing-footer-group-title">Elsewhere</h3>
            {SOCIAL_ICON_LINKS.map(({ label, href, icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="landing-footer-social-link"
                aria-label={`${label} (opens in a new tab)`}
              >
                {createElement(icon, {
                  className: 'h-4 w-4',
                  'aria-hidden': true
                })}
                <span>{label}</span>
                <ArrowUpRight size={14} aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>
        <div className="landing-footer-bottom">
          <a
            href="/"
            className="nav-landing-logo landing-footer-logo"
            aria-label="Shortly — home"
          >
            <ShortlyLogo variant="full" className="shortly-logo--footer" />
          </a>
          <p className="landing-footer-copyright">
            &copy; {new Date().getFullYear()} Shortly
          </p>
        </div>
      </LandingFrameInner>
    </footer>
  );
};

export default LandingFooter;
