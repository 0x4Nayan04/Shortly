import { memo } from 'react';
import { Link2, MousePointerClick, Activity } from 'lucide-react';
import UrlForm from '../UrlForm';
import { DashboardStatsGridSkeleton } from '../LoadingSpinner';

const DashboardStatsZone = ({
  user,
  userStats,
  statsLoading,
  onUrlCreated
}) => (
  <section
    className="dashboard-zone dashboard-stats-zone"
    aria-labelledby="dashboard-overview-heading"
  >
    <h2 id="dashboard-overview-heading" className="sr-only">
      Overview
    </h2>

    <UrlForm user={user} variant="landing" onUrlCreated={onUrlCreated} />

    <div className="dashboard-stats-row" aria-busy={statsLoading}>
      {statsLoading ? (
        <DashboardStatsGridSkeleton />
      ) : (
        <>
          <div className="app-panel dashboard-stat-card dashboard-stat-card--links">
            <div className="dashboard-stat__header">
              <Link2
                className="dashboard-stat__icon"
                aria-hidden="true"
                strokeWidth={2}
              />
              <p className="dashboard-stat__label">Total links</p>
            </div>
            <p className="dashboard-stat__value tabular-nums">
              {userStats.totalUrls.toLocaleString()}
            </p>
          </div>
          <div className="app-panel dashboard-stat-card dashboard-stat-card--clicks">
            <div className="dashboard-stat__header">
              <MousePointerClick
                className="dashboard-stat__icon"
                aria-hidden="true"
                strokeWidth={2}
              />
              <p className="dashboard-stat__label">Total clicks (all time)</p>
            </div>
            <p className="dashboard-stat__value tabular-nums">
              {userStats.totalClicks.toLocaleString()}
            </p>
          </div>
          <div className="app-panel dashboard-stat-card dashboard-stat-card--avg">
            <div className="dashboard-stat__header">
              <Activity
                className="dashboard-stat__icon"
                aria-hidden="true"
                strokeWidth={2}
              />
              <p className="dashboard-stat__label">Avg clicks/link</p>
            </div>
            <p className="dashboard-stat__value tabular-nums">
              {userStats.avgClicksPerUrl.toLocaleString()}
            </p>
          </div>
        </>
      )}
    </div>
  </section>
);

export default memo(DashboardStatsZone);
