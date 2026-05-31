import { useMemo, useState } from 'react';
import { CalendarDays, Globe, Link2, MousePointerClick } from 'lucide-react';

const BreakdownBar = ({ label, count, total }) => {
  const sharePct = total > 0 ? (count / total) * 100 : 0;
  const displayPct = Math.round(sharePct);
  const displayLabel = label ? label : 'Unknown / Local';

  return (
    <div className='click-analytics__breakdown-row'>
      <span
        className='click-analytics__breakdown-label'
        title={displayLabel}>
        {displayLabel}
      </span>
      <div className='click-analytics__breakdown-track'>
        <div
          className='click-analytics__breakdown-fill'
          style={{ width: `${sharePct}%` }}
          role='presentation'
        />
      </div>
      <span className='click-analytics__breakdown-count tabular-nums'>
        {count}
      </span>
      <span className='click-analytics__breakdown-pct tabular-nums'>
        {displayPct}%
      </span>
    </div>
  );
};

const BreakdownList = ({ data, total }) => {
  if (!data || data.length === 0) {
    return <p className='click-analytics__empty'>No data available yet</p>;
  }

  return (
    <div className='click-analytics__breakdown-list'>
      {data.map((item, idx) => (
        <BreakdownBar
          key={item._id || `unknown-${idx}`}
          label={item._id}
          count={item.count}
          total={total}
        />
      ))}
    </div>
  );
};

const CountriesBreakdown = ({ data, total }) => {
  const hasRows = Array.isArray(data) && data.length > 0;
  const showMoreDataHint = hasRows && data.length < 3;

  return (
    <>
      <BreakdownList
        data={data}
        total={total}
      />
      {showMoreDataHint && (
        <p className='click-analytics__countries-empty-state'>
          More data appears as your links get clicks from different locations.
        </p>
      )}
    </>
  );
};

const PlatformGroup = ({ title, data, total }) => (
  <section
    className='click-analytics__platform-group'
    aria-labelledby={`click-analytics-platform-${title.replace(/\s+/g, '-').toLowerCase()}`}>
    <h5
      id={`click-analytics-platform-${title.replace(/\s+/g, '-').toLowerCase()}`}
      className='click-analytics__platform-title'>
      {title}
    </h5>
    <BreakdownList
      data={data}
      total={total}
    />
  </section>
);

const getTodayKey = () => new Date().toISOString().slice(0, 10);

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const normalizeDailyClicks = (data = []) =>
  [...data]
    .filter((day) => day?._id)
    .sort((a, b) => a._id.localeCompare(b._id));

const fillDateRange = (data, startKey, endKey = getTodayKey()) => {
  const clickMap = new Map(data.map((d) => [d._id, d.clicks]));
  const filled = [];
  const start = new Date(`${startKey}T00:00:00`);
  const end = new Date(`${endKey}T00:00:00`);

  for (let d = start; d <= end; d = addDays(d, 1)) {
    const key = d.toISOString().slice(0, 10);
    filled.push({ _id: key, clicks: clickMap.get(key) || 0 });
  }

  return filled;
};

const fillMissingDays = (data, days = 30) => {
  const now = new Date();
  const clickMap = new Map(data.map((d) => [d._id, d.clicks]));
  const filled = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    filled.push({ _id: key, clicks: clickMap.get(key) || 0 });
  }

  return filled;
};

const getChartDataForRange = (data = [], range = '7d') => {
  const normalizedData = normalizeDailyClicks(data);

  if (range === 'all') {
    const firstClickKey = normalizedData.find((day) => day.clicks > 0)?._id;
    return fillDateRange(normalizedData, firstClickKey || getTodayKey());
  }

  return fillMissingDays(normalizedData, range === '30d' ? 30 : 7);
};

const ClicksChart = ({ data, rangeLabel }) => {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const allZero = data.every((d) => d.clicks === 0);

  if (allZero) {
    return (
      <div className='click-analytics__chart-empty'>
        <p className='click-analytics__empty'>
          No click activity in {rangeLabel.toLowerCase()}
        </p>
      </div>
    );
  }

  const clicks = data.map((d) => d.clicks);
  const maxClicks = Math.max(...clicks, 1);

  const tickIndices = new Set([0, data.length - 1]);
  const step = Math.max(1, Math.floor(data.length / 5));
  for (let i = step; i < data.length - 1; i += step) {
    tickIndices.add(i);
  }

  return (
    <div className='click-analytics__chart-plot'>
      <div className='click-analytics__chart-bars'>
        {data.map((day, idx) => {
          const dateLabel = new Date(day._id + 'T00:00:00').toLocaleDateString(
            'en-US',
            {
              month: 'short',
              day: 'numeric'
            }
          );
          const barPct = day.clicks === 0 ? 0 : (day.clicks / maxClicks) * 100;
          const isHovered = hoveredIdx === idx;

          return (
            <div
              key={day._id}
              className='click-analytics__chart-bar-col'
              tabIndex={0}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              onFocus={() => setHoveredIdx(idx)}
              onBlur={() => setHoveredIdx(null)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setHoveredIdx(idx);
                }
              }}>
              {isHovered && day.clicks > 0 && (
                <div className='click-analytics__chart-tooltip'>
                  <strong>
                    {day.clicks} click
                    {day.clicks !== 1 ? 's' : ''}
                  </strong>
                  <span>{dateLabel}</span>
                </div>
              )}

              {day.clicks > 0 && (
                <span
                  className={`click-analytics__chart-value${isHovered ? ' click-analytics__chart-value--visible' : ''}`}>
                  {day.clicks}
                </span>
              )}

              <div className='click-analytics__chart-bar-track'>
                <div
                  className={`click-analytics__chart-bar${day.clicks === 0 ? ' click-analytics__chart-bar--empty' : ''}`}
                  style={{
                    height: barPct ? `${Math.max(barPct, 4)}%` : '0',
                    minHeight: day.clicks ? '3px' : '0'
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className='click-analytics__chart-axis'>
        {data
          .filter((_, i) => tickIndices.has(i))
          .map((day) => (
            <span key={day._id}>
              {new Date(day._id + 'T00:00:00').toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              })}
            </span>
          ))}
      </div>
    </div>
  );
};

const rangeOptions = [
  { value: '7d', label: '7D', subtitle: 'Last 7 days' },
  { value: '30d', label: '30D', subtitle: 'Last 30 days' },
  {
    value: 'all',
    label: 'Available',
    subtitle: 'Since first click',
    title: 'Every stored day from your first click — up to 30 days of records'
  }
];

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
    <div className='click-analytics'>
      <section
        className='click-analytics__summary-strip dashboard-stats-row'
        aria-label='Click analytics summary'>
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`app-panel dashboard-stat-card ${card.variant}`}>
              <div className='dashboard-stat__header'>
                <Icon
                  className='dashboard-stat__icon'
                  aria-hidden='true'
                  strokeWidth={2}
                />
                <p className='dashboard-stat__label'>{card.label}</p>
              </div>
              <p className='dashboard-stat__value tabular-nums'>
                {card.value.toLocaleString()}
              </p>
            </div>
          );
        })}
      </section>

      <div className='click-analytics__chart-panel app-panel'>
        <header className='click-analytics__chart-header'>
          <div>
            <h3 className='click-analytics__chart-title'>Clicks over time</h3>
            <p className='click-analytics__chart-subtitle'>
              {selectedRangeOption.subtitle}
            </p>
          </div>
          <div
            className='click-analytics__range-toggle faq-filters'
            role='tablist'
            aria-label='Clicks over time range'>
            {rangeOptions.map((option) => (
              <button
                key={option.value}
                type='button'
                role='tab'
                aria-selected={selectedRange === option.value}
                title={option.title}
                onClick={() => setSelectedRange(option.value)}
                className={`faq-filter focus-ring ${
                  selectedRange === option.value ? 'faq-filter-active' : ''
                }`}>
                {option.label}
              </button>
            ))}
          </div>
        </header>
        <p className='click-analytics__chart-note'>
          Daily click records are kept for up to {retentionDays} days — this
          chart cannot show lifetime history. For all-time totals, see{' '}
          <strong>Total clicks (all time)</strong> in the overview above.
        </p>
        <ClicksChart
          data={chartData}
          rangeLabel={selectedRangeOption.subtitle}
        />
      </div>

      <div className='click-analytics__breakdowns'>
        <article className='click-analytics__breakdown-card app-panel'>
          <header className='click-analytics__breakdown-header'>
            <h4 className='click-analytics__breakdown-title'>Top countries</h4>
            <p className='click-analytics__breakdown-subtitle'>
              By click share
            </p>
          </header>
          <CountriesBreakdown
            data={countries}
            total={totalClicks}
          />
        </article>
        <article className='click-analytics__breakdown-card app-panel'>
          <header className='click-analytics__breakdown-header'>
            <h4 className='click-analytics__breakdown-title'>Platforms</h4>
            <p className='click-analytics__breakdown-subtitle'>
              Devices, browsers &amp; OS
            </p>
          </header>
          <div className='click-analytics__platforms'>
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
              <p className='click-analytics__empty'>
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
