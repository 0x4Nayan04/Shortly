import { Globe, Link2 } from 'lucide-react';

const BreakdownBar = ({ label, count, total, maxCount }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const widthPct = maxCount > 0 ? (count / maxCount) * 100 : 0;
  const displayLabel = label ? label : 'Unknown / Local';

  return (
    <div className='flex items-center gap-3 text-sm group'>
      <span
        className='w-24 sm:w-32 truncate text-gray-700 font-medium group-hover:text-indigo-600 transition-colors'
        title={displayLabel}>
        {displayLabel}
      </span>
      <div className='flex-1 h-2 bg-gray-100 rounded-full overflow-hidden'>
        <div
          className='h-full bg-indigo-500 rounded-full transition-all duration-500'
          style={{ width: `${widthPct}%` }}
        />
      </div>
      <span className='w-12 text-right text-gray-900 font-medium tabular-nums'>
        {count}
      </span>
      <span className='w-12 text-right text-gray-400 text-xs tabular-nums'>
        {pct}%
      </span>
    </div>
  );
};

const BreakdownSection = ({ title, data, total }) => {
  if (!data || data.length === 0) {
    return (
      <div className='p-5'>
        <h4 className='text-sm font-semibold text-gray-900 mb-2'>{title}</h4>
        <p className='text-xs text-gray-500'>No data available yet</p>
      </div>
    );
  }
  const maxCount = data[0]?.count || 1;
  return (
    <div className='p-5'>
      <h4 className='text-sm font-semibold text-gray-900 mb-4'>{title}</h4>
      <div className='space-y-3'>
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
    </div>
  );
};

const ClicksChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-10 text-gray-500'>
        <p className='text-sm font-medium'>
          No click activity in the last 30 days
        </p>
      </div>
    );
  }
  const clicks = data.map((d) => d.clicks);
  const maxClicks = Math.max(...clicks, 1);
  const CHART_HEIGHT = 160;

  return (
    <div className='p-5'>
      <h4 className='text-sm font-semibold text-gray-900 mb-6'>
        Clicks Over Time (30 Days)
      </h4>
      <div
        className='flex items-end gap-1 sm:gap-2'
        style={{ height: `${CHART_HEIGHT}px` }}>
        {data.map((day) => {
          const barHeight = Math.max(
            4,
            (day.clicks / maxClicks) * CHART_HEIGHT
          );
          return (
            <div
              key={day._id}
              className='flex-1 flex flex-col items-center min-w-0 group'
              title={`${day._id}: ${day.clicks} clicks`}>
              <div
                className='w-full max-w-[24px] bg-indigo-100 group-hover:bg-indigo-600 rounded-t transition-colors mt-auto'
                style={{ height: `${barHeight}px` }}
              />
            </div>
          );
        })}
      </div>
      <div className='flex justify-between mt-3 text-[10px] sm:text-xs text-gray-400 font-medium'>
        {data
          .filter(
            (_, i) =>
              i === 0 ||
              i === data.length - 1 ||
              i % Math.max(1, Math.floor(data.length / 5)) === 0
          )
          .map((day) => (
            <span key={day._id}>
              {new Date(day._id).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              })}
            </span>
          ))}
      </div>
    </div>
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
    <div className='space-y-6'>
      {/* Overview Stats */}
      <div className='grid grid-cols-2 gap-4 sm:gap-6'>
        <div className='bg-blue-50 border border-blue-100 rounded-xl p-4 sm:p-6 flex items-center justify-between'>
          <div>
            <p className='text-sm font-medium text-blue-600 mb-1'>
              Unique Countries
            </p>
            <p className='text-2xl sm:text-3xl font-bold text-blue-900'>
              {overview?.uniqueCountries || 0}
            </p>
          </div>
          <div className='w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600'>
            <Globe
              className='w-6 h-6'
              aria-hidden='true'
            />
          </div>
        </div>
        <div className='bg-purple-50 border border-purple-100 rounded-xl p-4 sm:p-6 flex items-center justify-between'>
          <div>
            <p className='text-sm font-medium text-purple-600 mb-1'>
              Unique Referrers
            </p>
            <p className='text-2xl sm:text-3xl font-bold text-purple-900'>
              {overview?.uniqueReferrers || 0}
            </p>
          </div>
          <div className='w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600'>
            <Link2
              className='w-6 h-6'
              aria-hidden='true'
            />
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className='border border-gray-200 rounded-xl overflow-hidden'>
        <ClicksChart data={clicksOverTime} />
      </div>

      {/* Breakdowns Grid */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-0 border border-gray-200 rounded-xl overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-gray-200'>
        <div className='divide-y divide-gray-200'>
          <BreakdownSection
            title='Top Countries'
            data={countries}
            total={totalClicks}
          />
          <BreakdownSection
            title='Top Devices'
            data={devices}
            total={totalClicks}
          />
        </div>
        <div className='divide-y divide-gray-200'>
          <BreakdownSection
            title='Top Browsers'
            data={browsers}
            total={totalClicks}
          />
          <BreakdownSection
            title='Top Operating Systems'
            data={operatingSystems}
            total={totalClicks}
          />
        </div>
      </div>
    </div>
  );
};

export default ClickAnalytics;
