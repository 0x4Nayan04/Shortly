import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Archive,
  Bell,
  CheckCircle,
  Clock,
  FileText,
  Info,
  ScrollText,
  Trash2,
  X
} from 'lucide-react';
import AppCatalogShell, {
  LandingFrameInner,
  LandingSectionBlock
} from './app/AppCatalogShell';
import AppNavbar from './app/AppNavbar';

const privacyExclusions = [
  'Full IP addresses',
  'Fingerprints',
  'Cookies for tracking',
  'GPS or exact location',
  'Personal information about visitors'
];

const privacyPolicySections = [
  {
    id: 'control',
    title: 'Your control',
    headingId: 'privacy-control-heading',
    items: [
      {
        id: 'delete-analytics',
        icon: CheckCircle,
        text: 'If you delete a short URL, its analytics are deleted along with it.'
      },
      {
        id: 'account-deletion',
        icon: Trash2,
        text: 'Request deletion of your account and associated data at any time.'
      }
    ]
  },
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
            Raw click events are retained for{' '}
            <strong className='text-ink'>30 days</strong>.
          </>
        )
      },
      {
        id: 'aggregated',
        icon: Archive,
        text: 'Aggregated analytics may be kept longer for historical insights.'
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
        text: 'Policy updates when analytics practices change.'
      },
      {
        id: 'change-log',
        icon: ScrollText,
        text: 'We will always document what changes and why.'
      }
    ]
  }
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
    description: 'IP addresses are used only momentarily to resolve country.'
  },
  {
    label: 'Retention window',
    value: '30 days',
    description: 'Raw click events are removed after the retention period.'
  }
];

const PrivacyPage = ({ user, onLogout, onShowAuth, onShowProfile }) => {
  return (
    <AppCatalogShell>
      <AppNavbar
        user={user}
        onLogout={onLogout}
        onShowAuth={onShowAuth}
        onShowProfile={onShowProfile}
      />
      <main
        id='main-content'
        className='flex-1'
        role='main'
        aria-labelledby='privacy-heading'>
        <LandingSectionBlock>
          <LandingFrameInner className='py-8'>
            <header className='mb-8 border-b border-border pb-6'>
              <Link
                to='/'
                className='mb-4 inline-flex items-center gap-1 text-[13px] text-muted-strong transition-colors duration-150 hover:text-primary'>
                <ArrowLeft
                  className='h-3.5 w-3.5'
                  aria-hidden='true'
                />
                Back to home
              </Link>
              <p className='mb-4 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-primary'>
                Privacy promise
              </p>
              <h1
                id='privacy-heading'
                className='font-display text-2xl font-medium tracking-display text-ink sm:text-3xl'>
                Privacy manifesto
              </h1>
              <p className='mt-2 max-w-2xl text-sm text-muted-strong sm:text-base'>
                Shortly is built as a privacy-first URL shortener. We collect
                the smallest amount of data needed to provide useful analytics,
                and we never sell or share that data with third parties.
              </p>

            </header>

            <div className='grid gap-4 sm:grid-cols-3'>
              {privacyHighlights.map((item) => (
                <article
                  key={item.label}
                  className='app-panel'>
                  <p className='text-xs font-semibold uppercase tracking-wider text-muted'>
                    {item.label}
                  </p>
                  <h2 className='mt-1 text-base font-semibold text-ink'>
                    {item.value}
                  </h2>
                  <p className='mt-2 text-sm text-muted-strong'>
                    {item.description}
                  </p>
                </article>
              ))}
            </div>
          </LandingFrameInner>
        </LandingSectionBlock>

        <LandingSectionBlock>
          <LandingFrameInner className='py-8'>
            <div className='app-panel !p-0 overflow-hidden'>
              <div className='border-b border-border p-6 sm:p-8'>
                <div className='mb-6 flex items-center gap-3'>
                  <FileText
                    className='h-5 w-5 text-primary'
                    aria-hidden='true'
                  />
                  <h2 className='text-lg font-semibold text-ink'>
                    What we collect
                  </h2>
                </div>

                <p className='mb-4 text-sm text-muted-strong'>
                  For each redirect, we record:
                </p>

                <div className='grid gap-4 sm:grid-cols-2'>
                  {[
                    {
                      title: 'Timestamp',
                      detail: 'When the redirect occurred.'
                    },
                    {
                      title: 'Country',
                      detail: 'Derived from the request IP at lookup.'
                    },
                    {
                      title: 'Referrer domain',
                      detail: 'Captured when the browser sends it.'
                    },
                    {
                      title: 'User agent details',
                      detail: 'Device type, browser, and OS.'
                    }
                  ].map((field) => (
                    <div
                      key={field.title}
                      className='flex flex-col border border-border bg-[var(--color-surface-muted)] px-4 py-3'>
                      <strong className='text-sm text-ink'>
                        {field.title}
                      </strong>
                      <span className='mt-1 text-xs text-muted'>
                        {field.detail}
                      </span>
                    </div>
                  ))}
                </div>

                <div className='mt-5 flex items-center gap-3 border-t border-border bg-[var(--color-blue-tint)] px-4 py-3 text-sm text-muted-strong'>
                  <Info
                    className='h-5 w-5 shrink-0 text-primary'
                    aria-hidden='true'
                  />
                  <span>
                    We do not store raw IP addresses. We use the IP address only
                    at request time to derive a country and discard it
                    immediately.
                  </span>
                </div>
              </div>

              <div className='border-b border-border bg-[var(--color-surface-muted)] p-6 sm:p-8'>
                <header className='mb-6 max-w-xl'>
                  <h2 className='text-lg font-semibold text-ink'>
                    What we don't collect
                  </h2>
                  <p className='mt-1.5 text-sm leading-relaxed text-muted'>
                    Strict boundaries on your data.
                  </p>
                </header>
                <ul
                  className='grid grid-cols-1 gap-3 lg:grid-cols-3 lg:gap-4'
                  role='list'>
                  {privacyExclusions.map((item, index) => (
                    <li
                      key={item}
                      className={`flex items-start gap-3 border border-border bg-surface px-4 py-3.5 ${
                        index === 4 ? 'lg:col-span-3' : ''
                      }`}>
                      <X
                        className='mt-0.5 h-4 w-4 shrink-0 text-[#dc2626]'
                        aria-hidden='true'
                      />
                      <span className='text-sm leading-snug text-muted-strong'>
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
          <LandingFrameInner className='py-8'>
            <div className='app-panel privacy-panel'>
              <div className='privacy-panel__grid'>
                {privacyPolicySections.map((section) => (
                  <section
                    key={section.id}
                    className='privacy-section'
                    aria-labelledby={section.headingId}>
                    <h2
                      id={section.headingId}
                      className='privacy-section__title'>
                      {section.title}
                    </h2>
                    <ul
                      className='privacy-section__tiles'
                      role='list'>
                      {section.items.map((item) => {
                        const Icon = item.icon;
                        return (
                          <li
                            key={item.id}
                            className='privacy-tile'>
                            <Icon
                              className='privacy-tile__icon'
                              aria-hidden='true'
                            />
                            <span className='privacy-tile__text'>
                              {item.text}
                            </span>
                          </li>
                        );
                      })}
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
