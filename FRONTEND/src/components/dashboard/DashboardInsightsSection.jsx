import { memo } from 'react';
import { DashboardInsightsGridSkeleton } from '../LoadingSpinner';
import ActivityChart from './ActivityChart';
import TopUrls from './TopUrls';

const DashboardInsightsSection = ({
  insightsPanelRef,
  statsLoading,
  showInsightsGrid,
  stats
}) => {
  if (!statsLoading && !showInsightsGrid) return null;

  return (
    <section
      ref={insightsPanelRef}
      className='dashboard-zone dashboard-zone--divider dashboard-insights-zone scroll-mt-[calc(var(--nav-height)+var(--section-bar-height))]'
      aria-labelledby='dashboard-insights-heading'>
      <h2
        id='dashboard-insights-heading'
        className='sr-only'>
        Insights
      </h2>
      {statsLoading ? (
        <DashboardInsightsGridSkeleton />
      ) : (
        <div className='dashboard-insights-grid'>
          <section
            aria-labelledby='dashboard-recent-activity-heading'
            className='app-panel dashboard-insights-panel'>
            <header className='dashboard-insights-panel__header'>
              <h3
                id='dashboard-recent-activity-heading'
                className='dashboard-insights-panel__title'>
                Last 7 days
              </h3>
              <p className='dashboard-insights-panel__subtitle'>
                New links created each day
              </p>
            </header>
            <ActivityChart data={stats?.recentActivity || []} />
          </section>
          <section
            aria-labelledby='dashboard-top-links-heading'
            className='app-panel dashboard-insights-panel'>
            <header className='dashboard-insights-panel__header'>
              <h3
                id='dashboard-top-links-heading'
                className='dashboard-insights-panel__title'>
                Top performers
              </h3>
              <p className='dashboard-insights-panel__subtitle'>
                Ranked by total clicks
              </p>
            </header>
            <TopUrls urls={stats?.topUrls || []} />
          </section>
        </div>
      )}
    </section>
  );
};

export default memo(DashboardInsightsSection);
