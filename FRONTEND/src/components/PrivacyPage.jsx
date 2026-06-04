import { createElement } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Archive,
  Bell,
  Clock,
  Database,
  FileText,
  Info,
  ScrollText,
  Trash2,
  User,
  X
} from 'lucide-react';
import AppCatalogShell, {
  LandingFrameInner,
  LandingSectionBlock
} from './app/AppCatalogShell';
import AppNavbar from './app/AppNavbar';
import { ROUTES } from '../constants/routes';

const PRIVACY_LAST_UPDATED = 'June 2026';

const redirectFields = [
  { title: 'Timestamp', detail: 'When the redirect occurred.' },
  {
    title: 'Country',
    detail: 'Derived from IP address via GeoIP lookup.'
  },
  {
    title: 'Referrer domain',
    detail: 'Captured when the browser sends it.'
  },
  {
    title: 'User agent details',
    detail: 'Device type, browser, and OS.'
  }
];

const privacyExclusions = [
  'Full IP addresses',
  'Fingerprints or cross-site identifiers',
  'Cookies for tracking',
  'Exact location data (city, GPS)',
  'Personal information about visitors'
];

const privacyHighlights = [
  {
    label: 'Minimal collection',
    value: 'Only redirect analytics',
    description: 'We store the least data needed to show useful insights.'
  },
  {
    label: 'No raw IP storage',
    value: 'Derived, then discarded',
    description:
      'IP addresses are used only at request time to resolve country, then discarded.'
  },
  {
    label: 'Retention window',
    value: '30 days',
    description:
      'Raw click events are automatically removed after the retention period.'
  }
];

const privacyPolicySections = [
  {
    id: 'retention',
    title: 'Data retention',
    headingId: 'privacy-retention-heading',
    items: [
      {
        id: 'raw-events',
        icon: Clock,
        text: (
          <>
            Raw click events are automatically deleted after{' '}
            <strong className="text-ink">30 days</strong> via a MongoDB TTL on
            the timestamp field. Once removed, individual records are
            permanently gone.
          </>
        )
      },
      {
        id: 'aggregated',
        icon: Archive,
        text: 'Aggregated statistics (totals, top countries, device breakdowns) are computed on demand from remaining raw data and are not stored permanently.'
      },
      {
        id: 'deleted-link-events',
        icon: Database,
        text: 'If you delete a short URL, its click events remain until their 30-day expiry but are no longer linked to any active account.'
      }
    ]
  },
  {
    id: 'control',
    title: 'Your control',
    headingId: 'privacy-control-heading',
    items: [
      {
        id: 'delete-link',
        icon: Trash2,
        text: 'Deleting a short URL hides it from your dashboard immediately. The link record, lifetime click counter, and raw events remain until the 30-day TTL expires. Delete your account to remove data sooner.'
      },
      {
        id: 'account-deletion',
        icon: Trash2,
        text: 'You can delete your account and associated data at any time. Account deletion removes your user record, short URLs, and click data in a single transactional flow on the server.'
      }
    ]
  },
  {
    id: 'transparency',
    title: 'Transparency',
    headingId: 'privacy-transparency-heading',
    items: [
      {
        id: 'policy-updates',
        icon: Bell,
        text: 'This policy is updated whenever we change analytics collection or retention practices.'
      },
      {
        id: 'change-log',
        icon: ScrollText,
        text: 'We will always document what changes and why.'
      }
    ]
  }
];

function PrivacyCallout({
  children,
  variant = 'info',
  icon = Info,
  className = 'mt-3'
}) {
  const bgClass =
    variant === 'muted'
      ? 'border border-border bg-[var(--color-surface-muted)]'
      : 'border-t border-border bg-[var(--color-blue-tint)]';

  return (
    <div
      className={`${className} flex items-start gap-3 px-4 py-3 text-sm text-muted-strong ${bgClass}`}
    >
      {createElement(icon, {
        className: 'size-5 shrink-0 text-primary',
        'aria-hidden': true
      })}
      <span>{children}</span>
    </div>
  );
}

function PrivacyPolicyTile({ icon, text }) {
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

const PrivacyPage = () => {
  return (
    <AppCatalogShell>
      <AppNavbar />
      <main
        id="main-content"
        className="flex-1"
        aria-labelledby="privacy-heading"
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
                Privacy policy
              </p>
              <h1
                id="privacy-heading"
                className="font-display text-2xl font-medium tracking-display text-ink sm:text-3xl"
              >
                Privacy policy
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-strong sm:text-base">
                Shortly is built as a privacy-first URL shortener. We collect
                the smallest amount of data needed to provide useful analytics,
                and we never sell or share that data with third parties.
              </p>
              <p className="mt-3 text-xs text-muted">
                Last updated: {PRIVACY_LAST_UPDATED}
              </p>
            </header>

            <div className="grid gap-4 sm:grid-cols-3">
              {privacyHighlights.map((item) => (
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
                  <FileText
                    className="size-5 text-primary"
                    aria-hidden="true"
                  />
                  <h2 className="text-lg font-semibold text-ink">
                    What we collect
                  </h2>
                </div>

                <p className="mb-4 text-sm text-muted-strong">
                  For each redirect, we record:
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  {redirectFields.map((field) => (
                    <div
                      key={field.title}
                      className="flex flex-col border border-border bg-[var(--color-surface-muted)] px-4 py-3"
                    >
                      <strong className="text-sm text-ink">
                        {field.title}
                      </strong>
                      <span className="mt-1 text-xs text-muted">
                        {field.detail}
                      </span>
                    </div>
                  ))}
                </div>

                <PrivacyCallout className="mt-5">
                  We do not store raw IP addresses. We use the IP address only
                  at request time to derive a country and discard it
                  immediately.
                </PrivacyCallout>

                <PrivacyCallout variant="muted" icon={User}>
                  <strong className="text-ink">Registered accounts:</strong> We
                  store your name, email, and password hash so you can sign in
                  and manage your links. Session auth uses an HTTP-only cookie
                  (not used to track visitors). Email addresses are used for
                  verification and password reset when email is enabled.
                </PrivacyCallout>

                <PrivacyCallout variant="muted">
                  <strong className="text-ink">Click counts:</strong> We send
                  the redirect first, then record the visit so links stay fast.
                  In rare cases — for example, if someone closes the tab very
                  quickly — a visit may not appear in your analytics. We
                  prioritize fast redirects over perfectly exact counts.
                </PrivacyCallout>
              </div>

              <div className="border-b border-border bg-[var(--color-surface-muted)] p-6 sm:p-8">
                <header className="mb-6 max-w-xl">
                  <h2 className="text-lg font-semibold text-ink">
                    What we don&apos;t collect
                  </h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">
                    Strict boundaries on visitor data.
                  </p>
                </header>
                <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {privacyExclusions.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 border border-border bg-surface px-4 py-3.5"
                    >
                      <X
                        className="mt-0.5 size-4 shrink-0 text-[var(--color-error)]"
                        aria-hidden="true"
                      />
                      <span className="text-sm leading-snug text-muted-strong">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </LandingFrameInner>
        </LandingSectionBlock>

        <LandingSectionBlock>
          <LandingFrameInner className="py-8">
            <div className="app-panel privacy-panel">
              <div className="privacy-panel__grid">
                {privacyPolicySections.map((section) => (
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
                        <PrivacyPolicyTile
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
      </main>
    </AppCatalogShell>
  );
};

export default PrivacyPage;
