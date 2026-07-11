import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Flag, Loader2, ShieldAlert } from 'lucide-react';
import {
  fetchAbuseReports,
  retireAbuseReport,
  updateAbuseReport
} from '../../api/abuse.api';
import { getApiErrorMessage, getApiPayload } from '../../utils/axiosInstance';
import { showToast } from '../../utils/showToast';
import AppCatalogShell, {
  LandingFrameInner,
  LandingSectionBlock
} from '../app/AppCatalogShell';
import AppNavbar from '../app/AppNavbar';
import FormAlert from '../forms/FormAlert';
import { ROUTES } from '../../constants/routes';

const STATUS_OPTIONS = ['pending', 'reviewed', 'resolved', 'dismissed'];

const statusBadgeClass = (status) => {
  const base =
    'inline-flex rounded px-2 py-0.5 text-xs font-medium capitalize';
  switch (status) {
    case 'pending':
      return `${base} bg-amber-100 text-amber-900`;
    case 'reviewed':
      return `${base} bg-blue-100 text-blue-900`;
    case 'resolved':
      return `${base} bg-emerald-100 text-emerald-900`;
    case 'dismissed':
      return `${base} bg-zinc-200 text-zinc-700`;
    default:
      return base;
  }
};

const formatDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleString();
};

const AbuseAdminPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetchAbuseReports({
        status: statusFilter || undefined
      });
      const payload = getApiPayload(response);
      setReports(payload.reports ?? []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load abuse reports'));
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  useEffect(() => {
    const selected = reports.find((report) => report._id === selectedId);
    setDetail(selected ?? null);
    setReviewNotes(selected?.reviewNotes ?? '');
  }, [reports, selectedId]);

  const handleStatusChange = async (status) => {
    if (!selectedId) return;
    setActionLoading(true);
    try {
      await updateAbuseReport(selectedId, { status, reviewNotes });
      showToast.success('Report updated');
      await loadReports();
    } catch (err) {
      showToast.error(getApiErrorMessage(err, 'Failed to update report'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRetire = async () => {
    if (!selectedId || !detail) return;
    setActionLoading(true);
    try {
      await retireAbuseReport(selectedId);
      showToast.success(`Retired slug "${detail.slug}"`);
      await loadReports();
    } catch (err) {
      showToast.error(getApiErrorMessage(err, 'Failed to retire link'));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AppCatalogShell>
      <AppNavbar />
      <LandingSectionBlock label="TRUST" index={1} total={1}>
        <LandingFrameInner className="py-10">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <Link
                to={ROUTES.DASHBOARD}
                className="landing-text-link mb-3 inline-flex items-center gap-2 text-sm"
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                Back to dashboard
              </Link>
              <h1 className="font-display text-2xl font-medium tracking-display text-ink">
                Abuse report queue
              </h1>
              <p className="mt-2 text-muted-strong">
                Review public reports, update status, and retire abusive short
                links.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="abuse-status-filter" className="text-sm text-muted-strong">
                Status
              </label>
              <select
                id="abuse-status-filter"
                value={statusFilter}
                onChange={(e) => {
                  setSelectedId(null);
                  setStatusFilter(e.target.value);
                }}
                className="sm-input"
              >
                <option value="">All</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <FormAlert error={error} />

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <section
              aria-labelledby="abuse-queue-heading"
              className="app-panel overflow-hidden"
            >
              <h2 id="abuse-queue-heading" className="sr-only">
                Report queue
              </h2>
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-12 text-muted-strong">
                  <Loader2 className="size-5 animate-spin" aria-hidden="true" />
                  Loading reports…
                </div>
              ) : reports.length === 0 ? (
                <p className="py-12 text-center text-muted-strong">
                  No reports match this filter.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {reports.map((report) => (
                    <li key={report._id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(report._id)}
                        className={`w-full px-4 py-4 text-left transition-colors hover:bg-[var(--color-surface-muted)] ${
                          selectedId === report._id
                            ? 'bg-[var(--color-surface-muted)]'
                            : ''
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-mono text-sm text-ink">
                            /{report.slug}
                          </span>
                          <span className={statusBadgeClass(report.status)}>
                            {report.status}
                          </span>
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm text-muted-strong">
                          {report.reason}
                        </p>
                        <p className="mt-2 text-xs text-muted">
                          {formatDate(report.createdAt)}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section
              aria-labelledby="abuse-detail-heading"
              className="app-panel p-6"
            >
              <h2
                id="abuse-detail-heading"
                className="font-display text-lg font-medium text-ink"
              >
                Report detail
              </h2>
              {!detail ? (
                <p className="mt-4 text-sm text-muted-strong">
                  Select a report to review details and take action.
                </p>
              ) : (
                <div className="mt-4 space-y-4 text-sm">
                  <div>
                    <p className="text-muted-strong">Slug</p>
                    <p className="font-mono text-ink">/{detail.slug}</p>
                  </div>
                  <div>
                    <p className="text-muted-strong">Reason</p>
                    <p className="whitespace-pre-wrap text-ink">{detail.reason}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-muted-strong">Reporter</p>
                      <p>{detail.reporterEmail || 'Anonymous'}</p>
                    </div>
                    <div>
                      <p className="text-muted-strong">Link found</p>
                      <p>{detail.linkFound ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <p className="text-muted-strong">Retired at submit</p>
                      <p>{detail.linkRetiredAtSubmit ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <p className="text-muted-strong">Submitted</p>
                      <p>{formatDate(detail.createdAt)}</p>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="abuse-review-notes" className="sm-label">
                      Review notes
                    </label>
                    <textarea
                      id="abuse-review-notes"
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      rows={4}
                      className="sm-input w-full"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {STATUS_OPTIONS.filter((status) => status !== detail.status).map(
                      (status) => (
                        <button
                          key={status}
                          type="button"
                          disabled={actionLoading}
                          onClick={() => handleStatusChange(status)}
                          className="sm-btn sm-btn-secondary text-sm capitalize"
                        >
                          Mark {status}
                        </button>
                      )
                    )}
                  </div>

                  {detail.linkFound && !detail.linkRetiredAtSubmit ? (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={handleRetire}
                      className="sm-btn w-full sm:w-auto !bg-[#dc2626] text-white hover:!opacity-90"
                    >
                      <ShieldAlert className="mr-2 inline size-4" aria-hidden="true" />
                      Retire short link
                    </button>
                  ) : null}
                </div>
              )}
            </section>
          </div>

          <p className="mt-6 flex items-center gap-2 text-xs text-muted">
            <Flag className="size-4" aria-hidden="true" />
            Operator-only view. Actions are logged with your account email.
          </p>
        </LandingFrameInner>
      </LandingSectionBlock>
    </AppCatalogShell>
  );
};

export default AbuseAdminPage;
