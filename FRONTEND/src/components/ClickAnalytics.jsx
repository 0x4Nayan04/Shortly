import { useState, useEffect } from 'react';
import { Globe, Link2 } from 'lucide-react';

const BreakdownBar = ({ label, count, total, maxCount }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const widthPct = maxCount > 0 ? (count / maxCount) * 100 : 0;
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
          style={{ width: `${widthPct}%` }}
        />
      </div>
      <span className='click-analytics__breakdown-count tabular-nums'>
        {count}
      </span>
      <span className='click-analytics__breakdown-pct tabular-nums'>
        {pct}%
      </span>
    </div>
  );
};

const BreakdownSection = ({ title, data, total }) => {
  if (!data || data.length === 0) {
    return (
      <article className='click-analytics__breakdown-card'>
        <h4 className='click-analytics__breakdown-title'>{title}</h4>
        <p className='click-analytics__empty'>No data available yet</p>
      </article>
    );
  }
  const maxCount = data[0]?.count || 1;
  return (
    <article className='click-analytics__breakdown-card'>
      <h4 className='click-analytics__breakdown-title'>{title}</h4>
      <div className='click-analytics__breakdown-list'>
        {data.map((item, idx) => (
          <BreakdownBar
            key={item._id || `unknown-${idx}`}
            label={item._id}
            count={item.count}
            total={total}
            maxCount={maxCount}
          />
        ))}
      </div>
    </article>
  );
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

const ClicksChart = ({ data }) => {
  const [chartHeight, setChartHeight] = useState(
    typeof window !== 'undefined' && window.innerWidth < 640 ? 128 : 152
  );

  useEffect(() => {
    const onResize = () =>
      setChartHeight(window.innerWidth < 640 ? 128 : 152);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const fullData = fillMissingDays(data || []);
  const allZero = fullData.every((d) => d.clicks === 0);

  if (allZero) {
    return (
      <div className='click-analytics__chart-empty'>
        <p className='click-analytics__empty'>
          No click activity in the last 30 days
        </p>
      </div>
    );
  }

  const clicks = fullData.map((d) => d.clicks);
  const maxClicks = Math.max(...clicks, 1);

  const tickIndices = new Set([0, fullData.length - 1]);
  const step = Math.max(1, Math.floor(fullData.length / 5));
  for (let i = step; i < fullData.length - 1; i += step) {
    tickIndices.add(i);
  }

  return (
    <>
      <div
        className='click-analytics__chart-bars'
        style={{ height: `${chartHeight}px` }}>
        {fullData.map((day) => {
          const barHeightPct = Math.max(
            2,
            (day.clicks / maxClicks) * 100
          );
          return (
            <div
              key={day._id}
              className='click-analytics__chart-bar-col'
              title={`${day._id}: ${day.clicks} clicks`}>
              <div
                className='click-analytics__chart-bar'
                style={{ height: `${barHeightPct}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className='click-analytics__chart-axis'>
        {fullData
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
    </>
  );
};

const ClickAnalytics = ({ clickAnalytics }) => {
  if (!clickAnalytics) return null;

  const {
    overview,
    clicksOverTime,
    countries,
    devices,
    browsers,
    operatingSystems
  } = clickAnalytics;
  const totalClicks = overview?.total || 0;

  return (
    <div className='click-analytics'>
      <div className='click-analytics__summary'>
        <div className='click-analytics__metric'>
          <div className='click-analytics__metric-copy'>
            <p className='click-analytics__metric-label'>Unique countries</p>
            <p className='click-analytics__metric-value tabular-nums'>
              {(overview?.uniqueCountries || 0).toLocaleString()}
            </p>
          </div>
          <div className='click-analytics__metric-icon' aria-hidden='true'>
            <Globe className='h-5 w-5' />
          </div>
        </div>
        <div className='click-analytics__metric'>
          <div className='click-analytics__metric-copy'>
            <p className='click-analytics__metric-label'>Unique referrers</p>
            <p className='click-analytics__metric-value tabular-nums'>
              {(overview?.uniqueReferrers || 0).toLocaleString()}
            </p>
          </div>
          <div className='click-analytics__metric-icon' aria-hidden='true'>
            <Link2 className='h-5 w-5' />
          </div>
        </div>
      </div>

      <section
        className='click-analytics__chart-panel'
        aria-labelledby='click-analytics-chart-heading'>
        <header className='click-analytics__chart-header'>
          <h3
            id='click-analytics-chart-heading'
            className='click-analytics__chart-title'>
            Clicks over time
          </h3>
          <p className='click-analytics__chart-subtitle'>Last 30 days</p>
        </header>
        <ClicksChart data={clicksOverTime} />
      </section>

      <div className='click-analytics__breakdowns'>
        <BreakdownSection
          title='Top countries'
          data={countries}
          total={totalClicks}
        />
        <BreakdownSection
          title='Top devices'
          data={devices}
          total={totalClicks}
        />
        <BreakdownSection
          title='Top browsers'
          data={browsers}
          total={totalClicks}
        />
        <BreakdownSection
          title='Top operating systems'
          data={operatingSystems}
          total={totalClicks}
        />
      </div>
    </div>
  );
};

export default ClickAnalytics;
