import { memo, useMemo, useState } from 'react';
import { BarChart3 } from 'lucide-react';

const GRID_LINES = 3;

const ActivityChart = memo(({ data }) => {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const last7Days = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().slice(0, 10));
    }
    return days;
  }, []);

  const chartData = useMemo(() => {
    const byDate = (data || []).reduce((acc, d) => {
      acc[d._id] = { count: d.count, clicks: d.clicks || 0 };
      return acc;
    }, {});
    return last7Days.map((dateId, i) => ({
      _id: dateId,
      count: byDate[dateId]?.count ?? 0,
      clicks: byDate[dateId]?.clicks ?? 0,
      isToday: i === 6,
      isYesterday: i === 5
    }));
  }, [data, last7Days]);

  const totalLinks = chartData.reduce((s, d) => s + d.count, 0);
  const maxCount = Math.max(...chartData.map((d) => d.count), 1);
  const hasAnyData = chartData.some((d) => d.count > 0);
  const todayCount = chartData[chartData.length - 1]?.count ?? 0;

  if (!hasAnyData) {
    return (
      <div className='activity-chart activity-chart--empty'>
        <BarChart3
          className='activity-chart__empty-icon'
          strokeWidth={1.5}
          aria-hidden='true'
        />
        <p className='activity-chart__empty-text'>No links created yet</p>
        <p className='activity-chart__empty-hint'>
          Shorten your first URL above to get started
        </p>
      </div>
    );
  }

  return (
    <div className='activity-chart'>
      <div className='activity-chart__summary'>
        <div className='activity-chart__summary-main'>
          <span className='activity-chart__total'>{totalLinks}</span>
          <span className='activity-chart__total-label'>
            link{totalLinks !== 1 ? 's' : ''} created this week
          </span>
        </div>
        {todayCount > 0 && (
          <div className='activity-chart__today-badge'>{todayCount} today</div>
        )}
      </div>

      <div className='activity-chart__body'>
        <div
          className='activity-chart__yaxis'
          aria-hidden='true'>
          <span>{maxCount}</span>
          <span>{Math.round(maxCount / 2)}</span>
          <span>0</span>
        </div>

        <div className='activity-chart__plot'>
          <div
            className='activity-chart__grid'
            aria-hidden='true'>
            {Array.from({ length: GRID_LINES + 1 }, (_, i) => (
              <div
                key={i}
                className='activity-chart__gridline'
                style={{ bottom: `${(i / GRID_LINES) * 100}%` }}
              />
            ))}
          </div>

          <div className='activity-chart__bars'>
            {chartData.map((day, idx) => {
              const date = new Date(day._id + 'T00:00:00');
              const dayLabel = date.toLocaleDateString('en-US', {
                weekday: 'short'
              });
              const dateLabel = date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              });
              const barPct = day.count === 0 ? 0 : (day.count / maxCount) * 100;
              const isHovered = hoveredIdx === idx;

              return (
                <div
                  key={day._id}
                  className={`activity-chart__col${day.isToday ? ' activity-chart__col--today' : ''}`}
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
                  {isHovered && (
                    <div className='activity-chart__tooltip'>
                      <strong>
                        {day.count} link{day.count !== 1 ? 's' : ''}
                      </strong>
                      {day.clicks > 0 && (
                        <span>
                          {day.clicks} click{day.clicks !== 1 ? 's' : ''}{' '}
                          (lifetime)
                        </span>
                      )}
                      <span>{dateLabel}</span>
                    </div>
                  )}

                  {day.count > 0 && (
                    <span
                      className={`activity-chart__value${isHovered ? ' activity-chart__value--visible' : ''}`}>
                      {day.count}
                    </span>
                  )}

                  <div className='activity-chart__bar-track'>
                    <div
                      className={`activity-chart__bar${day.count === 0 ? ' activity-chart__bar--empty' : ''}${day.isToday ? ' activity-chart__bar--today' : ''}`}
                      style={{
                        height: barPct ? `${Math.max(barPct, 4)}%` : '3px'
                      }}
                    />
                  </div>

                  <span
                    className={`activity-chart__day${day.isToday ? ' activity-chart__day--today' : ''}`}>
                    {dayLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
});

ActivityChart.displayName = 'ActivityChart';

export default ActivityChart;
