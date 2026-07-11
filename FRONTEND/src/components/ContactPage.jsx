import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import AppCatalogShell, {
  LandingFrameInner,
  LandingSectionBlock
} from './app/AppCatalogShell';
import AppNavbar from './app/AppNavbar';
import { ContactChannelsList } from './legal/ContactChannels';
import { OPERATOR_NAME } from '../constants/contacts';
import { ROUTES } from '../constants/routes';

const ContactPage = () => {
  return (
    <AppCatalogShell>
      <AppNavbar />
      <main
        id="main-content"
        className="flex-1"
        aria-labelledby="contact-heading"
      >
        <LandingSectionBlock>
          <LandingFrameInner className="py-8">
            <header className="mb-8 border-b border-border pb-6">
              <Link
                to={ROUTES.HOME}
                className="mb-4 inline-flex items-center gap-1 text-[13px] text-muted-strong transition-colors duration-150 hover:text-primary focus-ring"
              >
                <ArrowLeft className="size-3.5" aria-hidden="true" />
                Back to home
              </Link>
              <p className="mb-4 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-primary">
                Contact
              </p>
              <h1
                id="contact-heading"
                className="font-display text-2xl font-medium tracking-display text-ink sm:text-3xl"
              >
                Contact {OPERATOR_NAME}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-strong sm:text-base">
                Reach the operator for support, abuse reports, or security
                disclosures. For suspected malicious short links, use the{' '}
                <Link to={ROUTES.REPORT} className="landing-text-link">
                  abuse report form
                </Link>{' '}
                so we can review the slug quickly.
              </p>
            </header>

            <ContactChannelsList />
          </LandingFrameInner>
        </LandingSectionBlock>
      </main>
    </AppCatalogShell>
  );
};

export default ContactPage;
