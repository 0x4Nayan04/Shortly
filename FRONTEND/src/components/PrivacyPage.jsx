import { createElement } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Archive,
  ArrowLeft,
  Bell,
  Clock,
  Database,
  FileText,
  Globe,
  Info,
  Lock,
  Scale,
  ScrollText,
  Shield,
  ShieldCheck,
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
import LandingFooter from './landing/LandingFooter';
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

const policySections = [
  {
    id: 'retention',
    title: 'Data retention',
    headingId: 'privacy-retention-heading',
    icon: Archive,
    items: [
      {
        id: 'raw-events',
        icon: Clock,
        summary: 'Raw click events auto-delete after 30 days.',
        bullets: ['MongoDB TTL index on the timestamp field.']
      },
      {
        id: 'aggregated',
        icon: Database,
        summary: 'Aggregated stats computed on demand from raw data.',
        bullets: ['Not stored permanently.']
      },
      {
        id: 'accounts',
        icon: Archive,
        summary: 'Account data retained while active.',
        bullets: [
          'Removed on account deletion.',
          'Brief backup retention by subprocessors.'
        ]
      }
    ]
  },
  {
    id: 'control',
    title: 'Your control',
    headingId: 'privacy-control-heading',
    icon: Scale,
    items: [
      {
        id: 'delete-link',
        icon: Trash2,
        summary: 'Delete a short URL immediately.',
        bullets: [
          'Clears destination, owner, management token, and click counter.',
          'Non-identifying slug tombstone remains to prevent reuse.'
        ],
        accent: 'destructive'
      },
      {
        id: 'account-deletion',
        icon: AlertTriangle,
        summary: 'Delete your account and associated data from Settings.',
        bullets: [
          'Removes user record and click data in one transaction.',
          'Retires owned slugs as non-identifying tombstones.'
        ],
        accent: 'destructive'
      },
      {
        id: 'rights',
        icon: Scale,
        summary: 'Manage links, review analytics, update profile.',
        bullets: ['All available from dashboard and settings pages.']
      }
    ]
  },
  {
    id: 'usage',
    title: 'How we use data',
    headingId: 'privacy-usage-heading',
    icon: FileText,
    items: [
      {
        id: 'basis',
        icon: FileText,
        summary: 'Account data powers sign-in and link management.',
        bullets: [
          'Redirect analytics help link owners understand traffic.',
          'No raw IP storage. Short retention window.'
        ]
      },
      {
        id: 'transfers',
        icon: Globe,
        summary: 'Infrastructure may be outside your country.',
        bullets: ['Depends on hosting and provider locations.']
      }
    ]
  },
  {
    id: 'transparency',
    title: 'Transparency & safety',
    headingId: 'privacy-transparency-heading',
    icon: ShieldCheck,
    items: [
      {
        id: 'policy-updates',
        icon: Bell,
        summary: 'Page updated when practices change.',
        bullets: ['Last-updated date at top reflects latest revision.']
      },
      {
        id: 'link-safety',
        icon: Lock,
        summary: 'Private and loopback destinations blocked on save.',
        bullets: [
          'IP used only at request time to derive country.',
          'Never stored.'
        ]
      },
      {
        id: 'children',
        icon: Users,
        summary: 'Not directed at children under 13.',
        bullets: ['Or the minimum age in your jurisdiction.']
      }
    ]
  }
];

function PolicyCard({ item }) {
  const isDestructive = item.accent === 'destructive';

  return (
    <li
      className={`flex items-start gap-3 border px-4 py-3 text-sm leading-relaxed ${
        isDestructive
          ? 'border-[var(--color-error-border)] bg-[var(--color-error-tint)]'
          : 'border-border bg-[var(--color-surface-muted)]'
      }`}
    >
      {createElement(item.icon, {
        className: `mt-0.5 size-4 shrink-0 ${isDestructive ? 'text-[var(--color-error)]' : 'text-primary'}`,
        'aria-hidden': true
      })}
      <div className="min-w-0 flex-1">
        <p
          className={`font-medium ${
            isDestructive ? 'text-ink' : 'text-ink'
          }`}
        >
          {item.summary}
        </p>
        {item.bullets && item.bullets.length > 0 && (
          <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-xs text-muted-strong">
            {item.bullets.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}

function PolicySection({ section }) {
  return (
    <section
      aria-labelledby={section.headingId}
      className="app-panel !p-5"
    >
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex size-8 items-center justify-center bg-[var(--color-blue-tint)]">
          {createElement(section.icon, {
            className: 'size-4 text-primary',
            'aria-hidden': true
          })}
        </div>
        <h2
          id={section.headingId}
          className="font-display text-base font-semibold text-ink"
        >
          {section.title}
        </h2>
      </div>
      <ul className="flex flex-col gap-2.5">
        {section.items.map((item) => (
          <PolicyCard key={item.id} item={item} />
        ))}
      </ul>
    </section>
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
            <Link
              to={ROUTES.HOME}
              className="mb-4 inline-flex items-center gap-1 text-[13px] text-muted-strong transition-colors duration-150 hover:text-primary focus-ring"
            >
              <ArrowLeft className="size-3.5" aria-hidden="true" />
              Back to home
            </Link>

            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-xl">
                <p className="mb-3 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-primary">
                  Privacy
                </p>
                <h1
                  id="privacy-heading"
                  className="font-display text-2xl font-medium tracking-display text-ink sm:text-3xl"
                >
                  How Shortly handles data
                </h1>
                <p className="mt-2 text-sm text-muted-strong sm:text-base">
                  Shortly is built as a privacy-first URL shortener. This page
                  explains what the app collects, what it avoids, and how long
                  data is kept.
                </p>
                <p className="mt-2 text-xs text-muted">
                  Last updated: {PRIVACY_LAST_UPDATED}
                </p>
              </div>

              <div className="flex shrink-0 gap-3 sm:mt-10">
                {privacyHighlights.map((item) => (
                  <div
                    key={item.label}
                    className="flex flex-col items-center border border-border bg-surface px-4 py-3 text-center"
                  >
                    <span className="text-[11px] font-medium uppercase tracking-wider text-muted">
                      {item.label}
                    </span>
                    <span className="mt-0.5 text-base font-semibold text-ink">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </LandingFrameInner>
        </LandingSectionBlock>

        <LandingSectionBlock>
          <LandingFrameInner className="py-4">
            <div className="app-panel !p-0 overflow-hidden">
              <div className="grid border-b border-border sm:grid-cols-2">
                <div className="border-b border-border p-6 sm:border-b-0 sm:border-r sm:p-8">
                  <div className="mb-5 flex items-center gap-3">
                    <FileText
                      className="size-5 text-primary"
                      aria-hidden="true"
                    />
                    <h2 className="text-lg font-semibold text-ink">
                      What we collect
                    </h2>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {redirectFields.map((field) => (
                      <div
                        key={field.title}
                        className="flex flex-col border border-border bg-[var(--color-surface-muted)] px-3 py-2.5"
                      >
                        <strong className="text-sm text-ink">
                          {field.title}
                        </strong>
                        <span className="mt-0.5 text-xs text-muted">
                          {field.detail}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 border-t border-border bg-[var(--color-blue-tint)] px-4 py-3 text-sm text-muted-strong">
                    We do not store raw IP addresses. We use the IP only at
                    request time to derive a country and discard it immediately.
                  </div>
                </div>

                <div className="bg-[var(--color-surface-muted)] p-6 sm:p-8">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex size-5 items-center justify-center">
                      <X
                        className="size-5 text-[var(--color-error)]"
                        aria-hidden="true"
                      />
                    </div>
                    <h2 className="text-lg font-semibold text-ink">
                      What we don&apos;t collect
                    </h2>
                  </div>
                  <ul className="flex flex-col gap-2">
                    {privacyExclusions.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2.5 border border-border bg-surface px-3 py-2.5"
                      >
                        <X
                          className="mt-0.5 size-3.5 shrink-0 text-[var(--color-error)]"
                          aria-hidden="true"
                        />
                        <span className="text-sm text-muted-strong">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="p-6 sm:p-8">
                <div className="mb-5 flex items-center gap-3">
                  <ScrollText
                    className="size-5 text-primary"
                    aria-hidden="true"
                  />
                  <h2 className="text-lg font-semibold text-ink">
                    Subprocessors
                  </h2>
                </div>
                <p className="mb-4 text-sm text-muted-strong">
                  These providers process data on our instructions and are not
                  used for separate marketing profiles.
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
            <div className="grid gap-4 sm:grid-cols-2">
              {policySections.map((section) => (
                <PolicySection key={section.id} section={section} />
              ))}
            </div>
          </LandingFrameInner>
        </LandingSectionBlock>
      </main>
      <LandingSectionBlock className="site-footer-block">
        <LandingFooter />
      </LandingSectionBlock>
    </AppCatalogShell>
  );
};

export default PrivacyPage;
