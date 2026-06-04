import { useMemo, useState } from 'react';
import { CalendarDays, Globe, Link2, MousePointerClick } from 'lucide-react';
import {
  CountriesBreakdown,
  PlatformGroup
} from './clickAnalytics/BreakdownBar';
import { getChartDataForRange, rangeOptions } from './clickAnalytics/chartData';
import ClicksChart from './clickAnalytics/ClicksChart';

const ClickAnalytics = ({ clickAnalytics }) => {
  const [selectedRange, setSelectedRange] = useState('7d');

  const {
    overview,
    clicksOverTime,
    countries,
    devices,
    browsers,
    operatingSystems,
    periodDays = 30,
    retentionDays = 30
  } = clickAnalytics || {};
  const totalClicks = overview?.total || 0;
  const uniqueCountries = overview?.uniqueCountries || 0;
  const uniqueReferrers = overview?.uniqueReferrers || 0;

  const selectedRangeOption = rangeOptions.find(
    (option) => option.value === selectedRange
  );
  const chartData = useMemo(
    () => getChartDataForRange(clicksOverTime || [], selectedRange),
    [clicksOverTime, selectedRange]
  );
  const activeDays = useMemo(
    () => chartData.filter((d) => d.clicks > 0).length,
    [chartData]
  );

  const statCards = [
    {
      label: `Clicks (${periodDays}d)`,
      value: totalClicks,
      icon: MousePointerClick,
      variant: 'dashboard-stat-card--clicks'
    },
    {
      label: `Active days (${selectedRangeOption.label})`,
      value: activeDays,
      icon: CalendarDays,
      variant: 'dashboard-stat-card--avg'
    },
    {
      label: 'Countries',
      value: uniqueCountries,
      icon: Globe,
      variant: 'dashboard-stat-card--links'
    },
    {
      label: 'Referrers',
      value: uniqueReferrers,
      icon: Link2,
      variant: 'dashboard-stat-card--links'
    }
  ];

  const platformGroups = [
    { title: 'Devices', data: devices },
    { title: 'Browsers', data: browsers },
    { title: 'Operating systems', data: operatingSystems }
  ];
  const platformGroupsWithData = platformGroups.filter(
    (group) => group.data?.length
  );

  if (!clickAnalytics) return null;

  return (
    <div className="click-analytics">
      <section
        className="click-analytics__summary-strip dashboard-stats-row"
        aria-label="Click analytics summary"
      >
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`app-panel dashboard-stat-card ${card.variant}`}
            >
              <div className="dashboard-stat__header">
                <Icon
                  className="dashboard-stat__icon"
                  aria-hidden="true"
                  strokeWidth={2}
                />
                <p className="dashboard-stat__label">{card.label}</p>
              </div>
              <p className="dashboard-stat__value tabular-nums">
                {card.value.toLocaleString()}
              </p>
            </div>
          );
        })}
      </section>

      <div className="click-analytics__chart-panel app-panel">
        <header className="click-analytics__chart-header">
          <div>
            <h3 className="click-analytics__chart-title">Clicks over time</h3>
            <p className="click-analytics__chart-subtitle">
              {selectedRangeOption.subtitle}
            </p>
          </div>
          <div
            className="click-analytics__range-toggle faq-filters"
            role="tablist"
            aria-label="Clicks over time range"
          >
            {rangeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                role="tab"
                aria-selected={selectedRange === option.value}
                title={option.title}
                onClick={() => setSelectedRange(option.value)}
                className={`faq-filter focus-ring ${
                  selectedRange === option.value ? 'faq-filter-active' : ''
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </header>
        <p className="click-analytics__chart-note">
          Daily click records are kept for up to {retentionDays} days: this
          chart cannot show lifetime history. For all-time totals, see{' '}
          <strong>Total clicks (all time)</strong> in the overview above.
        </p>
        <ClicksChart
          data={chartData}
          rangeLabel={selectedRangeOption.subtitle}
        />
      </div>

      <div className="click-analytics__breakdowns">
        <article className="click-analytics__breakdown-card app-panel">
          <header className="click-analytics__breakdown-header">
            <h4 className="click-analytics__breakdown-title">Top countries</h4>
            <p className="click-analytics__breakdown-subtitle">
              By click share
            </p>
          </header>
          <CountriesBreakdown data={countries} total={totalClicks} />
        </article>
        <article className="click-analytics__breakdown-card app-panel">
          <header className="click-analytics__breakdown-header">
            <h4 className="click-analytics__breakdown-title">Platforms</h4>
            <p className="click-analytics__breakdown-subtitle">
              Devices, browsers &amp; OS
            </p>
          </header>
          <div className="click-analytics__platforms">
            {platformGroupsWithData.length > 0 ? (
              platformGroupsWithData.map((group) => (
                <PlatformGroup
                  key={group.title}
                  title={group.title}
                  data={group.data}
                  total={totalClicks}
                />
              ))
            ) : (
              <p className="click-analytics__empty">
                No platform data available yet
              </p>
            )}
          </div>
        </article>
      </div>
    </div>
  );
};

export default ClickAnalytics;
