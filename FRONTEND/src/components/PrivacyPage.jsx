import { createElement } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Archive,
  Bell,
  Clock,
  Database,
  FileText,
  Globe,
  Info,
  Scale,
  ScrollText,
  Shield,
  Trash2,
  User,
  Users,
  X
} from 'lucide-react';
import AppCatalogShell, {
  LandingFrameInner,
  LandingSectionBlock
} from './app/AppCatalogShell';
import AppNavbar from './app/AppNavbar';
import { ROUTES } from '../constants/routes';

const PRIVACY_LAST_UPDATED = 'July 2026';

const redirectFields = [
  { title: 'Timestamp', detail: 'When the redirect occurred.' },
  {
    title: 'Country',
    detail: 'Derived from IP address via GeoIP lookup.'
  },
  {
    title: 'Normalized referrer hostname',
    detail: 'Stored only for valid HTTP(S) referrers sent by the browser.'
  },
  {
    title: 'User agent details',
    detail: 'Device type, browser, and OS.'
  }
];

const privacyExclusions = [
  'Stored full IP addresses',
  'Fingerprints or cross-site identifiers',
  'Cookies for tracking visitors across sites',
  'Exact location data (city, GPS)',
  'Marketing profiles of anonymous visitors'
];

const privacyHighlights = [
  {
    label: 'Minimal collection',
    value: 'Redirect analytics only',
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

const subprocessors = [
  {
    name: 'MongoDB Atlas',
    purpose: 'Database hosting',
    data: 'Accounts, links, click events'
  },
  {
    name: 'Resend',
    purpose: 'Transactional email',
    data: 'Email address, message content'
  },
  {
    name: 'Hosting providers',
    purpose: 'App & API delivery (e.g. Vercel, Railway/Render/Fly)',
    data: 'Request metadata, operational logs'
  },
  {
    name: 'GeoIP (geoip-lite)',
    purpose: 'Country lookup at redirect time',
    data: 'IP used transiently, not stored'
  },
  {
    name: 'Gravatar',
    purpose: 'Default account avatar',
    data: 'Email hash'
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
            the timestamp field.
          </>
        )
      },
      {
        id: 'aggregated',
        icon: Archive,
        text: 'Aggregated statistics are computed on demand from remaining raw data and are not stored permanently.'
      },
      {
        id: 'accounts',
        icon: Database,
        text: 'Account data is retained while your account is active and removed when you delete your account, subject to brief backup retention by subprocessors.'
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
        text: 'Deleting a short URL immediately clears its destination, owner, management token, and lifetime click counter. A non-identifying slug tombstone remains permanently to prevent reuse.'
      },
      {
        id: 'account-deletion',
        icon: Trash2,
        text: 'You can delete your account and associated data from Settings. Account deletion removes your user record and click data, and retires owned slugs as non-identifying tombstones, in one server transaction.'
      },
      {
        id: 'rights',
        icon: Scale,
        text: 'You can manage links, review analytics, update your profile, and delete your account from the dashboard and settings pages.'
      }
    ]
  },
  {
    id: 'legal',
    title: 'How we use data',
    headingId: 'privacy-legal-heading',
    items: [
      {
        id: 'basis',
        icon: FileText,
        text: 'Account data powers sign-in and link management. Redirect analytics help link owners understand traffic while keeping visitor data minimal — no raw IP storage and a short retention window.'
      },
      {
        id: 'transfers',
        icon: Globe,
        text: 'Infrastructure may be located outside your country depending on where the app is hosted and which providers are used.'
      }
    ]
  },
  {
    id: 'transparency',
    title: 'Transparency & safety',
    headingId: 'privacy-transparency-heading',
    items: [
      {
        id: 'policy-updates',
        icon: Bell,
        text: 'This page is updated when collection, retention, or sharing practices change. The last-updated date at the top reflects the latest revision.'
      },
      {
        id: 'link-safety',
        icon: Shield,
        text: 'Shortly blocks private and loopback redirect destinations when links are saved. Visitor IP addresses are used only at request time to derive country and are not stored.'
      },
      {
        id: 'children',
        icon: Users,
        text: 'Shortly is not directed at children under 13 (or the minimum age in your jurisdiction).'
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
                Privacy
              </p>
              <h1
                id="privacy-heading"
                className="font-display text-2xl font-medium tracking-display text-ink sm:text-3xl"
              >
                How Shortly handles data
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-strong sm:text-base">
                Shortly is built as a privacy-first URL shortener. This page
                explains what the app collects, what it avoids, and how long data
                is kept. It is an informational overview of the product — not a
                formal legal agreement.
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
                  (not used to track visitors).
                </PrivacyCallout>

                <PrivacyCallout variant="muted">
                  <strong className="text-ink">Click counts:</strong> We send
                  the redirect first, then record the visit so links stay fast.
                  In rare cases a visit may not appear in your analytics. We
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

              <div className="p-6 sm:p-8">
                <header className="mb-6 flex items-center gap-3">
                  <ScrollText
                    className="size-5 text-primary"
                    aria-hidden="true"
                  />
                  <h2 className="text-lg font-semibold text-ink">
                    Subprocessors
                  </h2>
                </header>
                <p className="mb-4 text-sm text-muted-strong">
                  Shortly relies on these providers to run. They process data
                  on our instructions and are not used for separate marketing
                  profiles.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-xs uppercase tracking-wider text-muted">
                        <th className="px-3 py-2 font-semibold">Provider</th>
                        <th className="px-3 py-2 font-semibold">Purpose</th>
                        <th className="px-3 py-2 font-semibold">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subprocessors.map((row) => (
                        <tr
                          key={row.name}
                          className="border-b border-border text-muted-strong"
                        >
                          <td className="px-3 py-3 font-medium text-ink">
                            {row.name}
                          </td>
                          <td className="px-3 py-3">{row.purpose}</td>
                          <td className="px-3 py-3">{row.data}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
