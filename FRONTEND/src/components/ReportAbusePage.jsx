import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Flag, Loader2 } from 'lucide-react';
import { submitAbuseReport } from '../api/abuse.api';
import { getApiErrorMessage } from '../utils/axiosInstance';
import { useFormValidation } from '../hooks/useFormValidation';
import { validators } from '../utils/validation';
import { showToast } from '../utils/showToast';
import AppCatalogShell, {
  LandingFrameInner,
  LandingSectionBlock
} from './app/AppCatalogShell';
import AppNavbar from './app/AppNavbar';
import FormField from './forms/FormField';
import FormAlert from './forms/FormAlert';
import SuccessPanel from './forms/SuccessPanel';
import { ContactMailtoLink } from './legal/ContactChannels';
import { ABUSE_EMAIL } from '../constants/contacts';
import { ROUTES } from '../constants/routes';

const slugPattern = /^[a-z0-9_-]{3,20}$/;

const ReportAbusePage = () => {
  const [slug, setSlug] = useState('');
  const [reason, setReason] = useState('');
  const [reporterEmail, setReporterEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const getRules = useCallback(
    () => ({
      slug: [
        (value) => {
          const normalized = String(value || '')
            .trim()
            .toLowerCase();
          if (!normalized) return 'Short link slug is required';
          if (!slugPattern.test(normalized)) {
            return 'Enter the slug only (3–20 letters, numbers, hyphens, underscores)';
          }
          return null;
        }
      ],
      reason: [
        (value) => {
          const trimmed = String(value || '').trim();
          if (!trimmed) return 'Please describe the issue';
          if (trimmed.length < 10) {
            return 'Please provide at least 10 characters describing the issue';
          }
          if (trimmed.length > 2000) {
            return 'Reason cannot exceed 2000 characters';
          }
          return null;
        }
      ],
      reporterEmail: [
        (value) => {
          const trimmed = String(value || '').trim();
          if (!trimmed) return null;
          return validators.email(trimmed);
        }
      ]
    }),
    []
  );

  const { fieldErrors, touched, handleBlur, onFieldChange, validateAll } =
    useFormValidation(['slug', 'reason', 'reporterEmail'], getRules);

  const formValues = { slug, reason, reporterEmail };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateAll(formValues).valid) return;

    setLoading(true);
    setError('');

    try {
      const response = await submitAbuseReport({
        slug: slug.trim().toLowerCase(),
        reason: reason.trim(),
        reporterEmail: reporterEmail.trim() || undefined
      });
      showToast.success(
        response.message || 'Thank you. Your report has been received.'
      );
      setSubmitted(true);
    } catch (err) {
      const message = getApiErrorMessage(
        err,
        'Could not submit your report. Try again later.'
      );
      setError(message);
      showToast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <AppCatalogShell>
        <AppNavbar />
        <main id="main-content" className="flex-1">
          <LandingSectionBlock>
            <LandingFrameInner className="py-12">
              <SuccessPanel
                icon={<Flag className="size-8 text-primary" aria-hidden="true" />}
                heading="Report received"
                message="Thank you. We review abuse reports promptly and retire links that violate our Terms."
                primaryAction={
                  <Link to={ROUTES.HOME} className="sm-btn sm-btn-primary">
                    Back to home
                  </Link>
                }
              />
            </LandingFrameInner>
          </LandingSectionBlock>
        </main>
      </AppCatalogShell>
    );
  }

  return (
    <AppCatalogShell>
      <AppNavbar />
      <main
        id="main-content"
        className="flex-1"
        aria-labelledby="report-heading"
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
                Trust &amp; safety
              </p>
              <h1
                id="report-heading"
                className="font-display text-2xl font-medium tracking-display text-ink sm:text-3xl"
              >
                Report abuse
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-strong sm:text-base">
                Report phishing, malware, spam, or other policy violations on a
                Shortly short link. We aim to review reports within two business
                days. You can also email{' '}
                <ContactMailtoLink
                  email={ABUSE_EMAIL}
                  className="landing-text-link"
                />
                .
              </p>
            </header>

            <div className="app-panel max-w-xl">
              <form
                onSubmit={handleSubmit}
                className="space-y-4"
                aria-labelledby="report-heading"
              >
                <FormField
                  id="report-slug"
                  label="Short link slug"
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    onFieldChange(
                      'slug',
                      { ...formValues, slug: e.target.value },
                      { clearError: () => setError('') }
                    );
                  }}
                  onBlur={() => handleBlur('slug', formValues)}
                  error={fieldErrors.slug}
                  touched={touched.slug}
                  placeholder="e.g. abc123"
                  autoComplete="off"
                />
                <p className="-mt-2 text-xs text-muted">
                  Enter only the path after the domain, not the full URL.
                </p>

                <div>
                  <label
                    htmlFor="report-reason"
                    className="mb-1.5 block text-sm font-medium text-ink"
                  >
                    What is wrong with this link?
                  </label>
                  <textarea
                    id="report-reason"
                    value={reason}
                    onChange={(e) => {
                      setReason(e.target.value);
                      onFieldChange(
                        'reason',
                        { ...formValues, reason: e.target.value },
                        { clearError: () => setError('') }
                      );
                    }}
                    onBlur={() => handleBlur('reason', formValues)}
                    rows={5}
                    className="w-full border border-border bg-surface px-3 py-2 text-sm text-ink focus-ring"
                    placeholder="Describe the issue (phishing site, malware download, impersonation, etc.)"
                    aria-invalid={Boolean(touched.reason && fieldErrors.reason)}
                    aria-describedby={
                      touched.reason && fieldErrors.reason
                        ? 'report-reason-error'
                        : undefined
                    }
                  />
                  {touched.reason && fieldErrors.reason ? (
                    <p
                      id="report-reason-error"
                      className="mt-1 text-xs text-[var(--color-error)]"
                      role="alert"
                    >
                      {fieldErrors.reason}
                    </p>
                  ) : null}
                </div>

                <FormField
                  id="report-email"
                  label="Your email (optional)"
                  type="email"
                  value={reporterEmail}
                  onChange={(e) => {
                    setReporterEmail(e.target.value);
                    onFieldChange(
                      'reporterEmail',
                      { ...formValues, reporterEmail: e.target.value },
                      { clearError: () => setError('') }
                    );
                  }}
                  onBlur={() => handleBlur('reporterEmail', formValues)}
                  error={fieldErrors.reporterEmail}
                  touched={touched.reporterEmail}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
                <p className="-mt-2 text-xs text-muted">
                  Optional — helps us follow up if we need more detail.
                </p>

                <button
                  type="submit"
                  disabled={loading}
                  className="sm-btn sm-btn-primary inline-flex w-full items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2
                        className="size-4 animate-spin"
                        aria-hidden="true"
                      />
                      Submitting…
                    </>
                  ) : (
                    'Submit report'
                  )}
                </button>
              </form>

              <FormAlert error={error} />
            </div>
          </LandingFrameInner>
        </LandingSectionBlock>
      </main>
    </AppCatalogShell>
  );
};

export default ReportAbusePage;
