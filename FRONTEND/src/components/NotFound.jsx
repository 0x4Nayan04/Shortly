import { Link, useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, ExternalLink } from 'lucide-react';
import AppCatalogShell, {
  LandingFrameInner,
  LandingSectionBlock
} from './app/AppCatalogShell';
import AppNavbar from './app/AppNavbar';
import { ROUTES } from '../constants/routes';
import { LANDING_INFO_LINKS } from '../constants/landingNav';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <AppCatalogShell>
      <AppNavbar />
      <main id="main-content" className="flex-1">
        <LandingSectionBlock>
          <LandingFrameInner className="py-12">
            <div className="mx-auto max-w-md text-center">
              <div className="mx-auto mb-6 size-20 bg-[var(--color-blue-tint)] border border-border flex items-center justify-center">
                <span className="font-display text-4xl font-medium tracking-display text-primary">
                  404
                </span>
              </div>
              <h1 className="font-display text-2xl font-medium text-ink mb-2">
                Page not found
              </h1>
              <p className="text-muted-strong mb-1">
                The page you're looking for doesn't exist or has been moved.
              </p>
              <p className="text-sm text-muted mb-8">
                Check the URL for typos or use a link below.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="sm-btn sm-btn-secondary inline-flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="size-4" aria-hidden="true" />
                  Go back
                </button>
                <Link
                  to={ROUTES.HOME}
                  className="sm-btn sm-btn-primary inline-flex items-center justify-center gap-2"
                >
                  <Home className="size-4" aria-hidden="true" />
                  Home page
                </Link>
              </div>
              <div className="mt-8 border-t border-border pt-6">
                <p className="text-sm text-muted mb-3">
                  Try these pages instead:
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Link
                    to={ROUTES.HOME}
                    className="landing-text-link inline-flex items-center gap-1 text-sm"
                  >
                    URL Shortener{' '}
                    <ExternalLink className="size-3" aria-hidden="true" />
                  </Link>
                  <Link
                    to={ROUTES.LOGIN}
                    className="landing-text-link inline-flex items-center gap-1 text-sm"
                  >
                    Sign in{' '}
                    <ExternalLink className="size-3" aria-hidden="true" />
                  </Link>
                  <Link
                    to={ROUTES.REGISTER}
                    className="landing-text-link inline-flex items-center gap-1 text-sm"
                  >
                    Sign up{' '}
                    <ExternalLink className="size-3" aria-hidden="true" />
                  </Link>
                  {LANDING_INFO_LINKS.map((link) => (
                    <Link
                      key={link.label}
                      to={link.to}
                      className="landing-text-link inline-flex items-center gap-1 text-sm"
                    >
                      {link.label}{' '}
                      <ExternalLink className="size-3" aria-hidden="true" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </LandingFrameInner>
        </LandingSectionBlock>
      </main>
    </AppCatalogShell>
  );
};

export default NotFound;
