import { createElement } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Ban,
  Bell,
  FileText,
  Gavel,
  Info,
  Scale,
  Shield,
  UserX
} from 'lucide-react';
import AppCatalogShell, {
  LandingFrameInner,
  LandingSectionBlock
} from './app/AppCatalogShell';
import AppNavbar from './app/AppNavbar';
import {
  ContactChannelsList,
  ContactMailtoLink
} from './legal/ContactChannels';
import { ABUSE_EMAIL } from '../constants/contacts';
import { TERMS_LAST_UPDATED } from '../constants/legal';
import { ROUTES } from '../constants/routes';

const termsHighlights = [
  {
    label: 'Acceptable use',
    value: 'No abuse',
    description:
      'Shortly may not be used for phishing, malware, spam, or illegal activity.'
  },
  {
    label: 'Takedown response',
    value: 'Within 2 business days',
    description:
      'We review abuse reports promptly and retire violating links when confirmed.'
  },
  {
    label: 'Service',
    value: 'As-is',
    description:
      'Shortly is provided without warranties; liability is limited as described below.'
  }
];

const acceptableUseItems = [
  'Do not shorten links that distribute malware, exploit kits, or credential harvesters.',
  'Do not use Shortly for phishing, impersonation, or deceptive redirects.',
  'Do not send unsolicited bulk messages that violate anti-spam laws.',
  'Do not link to content that is illegal in applicable jurisdictions.',
  'Do not attempt to bypass rate limits, security controls, or other users’ accounts.'
];

const termsSections = [
  {
    id: 'accounts',
    title: 'Accounts & registration',
    headingId: 'terms-accounts-heading',
    items: [
      {
        id: 'eligibility',
        icon: UserX,
        text: 'You must be at least 13 years old (or the minimum age required in your jurisdiction) to create an account. By registering, you confirm that you meet this requirement and that the information you provide is accurate.'
      },
      {
        id: 'security',
        icon: Shield,
        text: 'You are responsible for safeguarding your account credentials and for activity under your account. Notify us promptly at the security contact below if you suspect unauthorized access.'
      }
    ]
  },
  {
    id: 'enforcement',
    title: 'Enforcement & takedown',
    headingId: 'terms-enforcement-heading',
    items: [
      {
        id: 'reports',
        icon: Ban,
        text: (
          <>
            Anyone can report suspected abuse via our{' '}
            <Link to={ROUTES.REPORT} className="landing-text-link">
              abuse report form
            </Link>{' '}
            or by emailing{' '}
            <ContactMailtoLink email={ABUSE_EMAIL} className="landing-text-link" />
            . We aim to acknowledge valid reports within two business days.
          </>
        )
      },
      {
        id: 'suspension',
        icon: Gavel,
        text: 'We may suspend accounts, retire short links, or block destinations that violate these Terms or pose a safety risk, with or without prior notice when urgent.'
      }
    ]
  },
  {
    id: 'legal',
    title: 'Disclaimers & liability',
    headingId: 'terms-legal-heading',
    items: [
      {
        id: 'as-is',
        icon: Scale,
        text: 'Shortly is provided on an “as is” and “as available” basis. We disclaim all warranties to the fullest extent permitted by law.'
      },
      {
        id: 'liability',
        icon: FileText,
        text: 'To the maximum extent permitted by law, Shortly and its operator are not liable for indirect, incidental, special, consequential, or punitive damages, or for loss of profits, data, or goodwill arising from your use of the service.'
      }
    ]
  },
  {
    id: 'changes',
    title: 'Changes',
    headingId: 'terms-changes-heading',
    items: [
      {
        id: 'updates',
        icon: Bell,
        text: 'We may update these Terms from time to time. Material changes will be reflected on this page with an updated “Last updated” date. Continued use after changes constitutes acceptance of the revised Terms.'
      }
    ]
  }
];

function TermsCallout({ children, className = 'mt-3' }) {
  return (
    <div
      className={`${className} flex items-start gap-3 border-t border-border bg-[var(--color-blue-tint)] px-4 py-3 text-sm text-muted-strong`}
    >
      <Info className="size-5 shrink-0 text-primary" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

function TermsPolicyTile({ icon, text }) {
  return (
    <li className="privacy-tile">
      {createElement(icon, {
        className: 'privacy-tile__icon',
        'aria-hidden': true
      })}
      <span className="privacy-tile__text">{text}</span>
    </li>
  );
}

const TermsPage = () => {
  return (
    <AppCatalogShell>
      <AppNavbar />
      <main id="main-content" className="flex-1" aria-labelledby="terms-heading">
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
                Terms of service
              </p>
              <h1
                id="terms-heading"
                className="font-display text-2xl font-medium tracking-display text-ink sm:text-3xl"
              >
                Terms of service
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-strong sm:text-base">
                These Terms govern your use of Shortly. By creating an account or
                using the service, you agree to them. This is a template for
                implementation — have qualified counsel review before relying on
                it for production legal obligations.
              </p>
              <p className="mt-3 text-xs text-muted">
                Last updated: {TERMS_LAST_UPDATED}
              </p>
            </header>

            <div className="grid gap-4 sm:grid-cols-3">
              {termsHighlights.map((item) => (
                <article key={item.label} className="app-panel">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                    {item.label}
                  </p>
                  <h2 className="mt-1 text-base font-semibold text-ink">
                    {item.value}
                  </h2>
                  <p className="mt-2 text-sm text-muted-strong">
                    {item.description}
                  </p>
                </article>
              ))}
            </div>
          </LandingFrameInner>
        </LandingSectionBlock>

        <LandingSectionBlock>
          <LandingFrameInner className="py-8">
            <div className="app-panel !p-0 overflow-hidden">
              <div className="border-b border-border p-6 sm:p-8">
                <div className="mb-6 flex items-center gap-3">
                  <Shield className="size-5 text-primary" aria-hidden="true" />
                  <h2 className="text-lg font-semibold text-ink">
                    Acceptable use
                  </h2>
                </div>
                <p className="mb-4 text-sm text-muted-strong">
                  Shortly is a URL shortener with analytics. You may use it for
                  lawful personal and business purposes. You may not:
                </p>
                <ul className="grid gap-3">
                  {acceptableUseItems.map((item) => (
                    <li
                      key={item}
                      className="border border-border bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-muted-strong"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
                <TermsCallout className="mt-5">
                  Destination websites are controlled by third parties. Shortly
                  does not endorse linked content and is not responsible for
                  external sites.
                </TermsCallout>
              </div>
            </div>
          </LandingFrameInner>
        </LandingSectionBlock>

        <LandingSectionBlock>
          <LandingFrameInner className="py-8">
            <div className="app-panel privacy-panel">
              <div className="privacy-panel__grid">
                {termsSections.map((section) => (
                  <section
                    key={section.id}
                    className="privacy-section"
                    aria-labelledby={section.headingId}
                  >
                    <h2
                      id={section.headingId}
                      className="privacy-section__title"
                    >
                      {section.title}
                    </h2>
                    <ul className="privacy-section__tiles">
                      {section.items.map((item) => (
                        <TermsPolicyTile
                          key={item.id}
                          icon={item.icon}
                          text={item.text}
                        />
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </div>
          </LandingFrameInner>
        </LandingSectionBlock>

        <LandingSectionBlock>
          <LandingFrameInner className="py-8">
            <h2 className="mb-4 text-lg font-semibold text-ink">Contact</h2>
            <p className="mb-6 max-w-2xl text-sm text-muted-strong">
              Questions about these Terms, account issues, or security concerns:
            </p>
            <ContactChannelsList />
          </LandingFrameInner>
        </LandingSectionBlock>
      </main>
    </AppCatalogShell>
  );
};

export default TermsPage;
