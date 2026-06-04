import { useHoveredIndex } from '../../hooks/useHoveredIndex';

const ClicksChart = ({ data, rangeLabel }) => {
  const { hoveredIdx, hoverHandlers } = useHoveredIndex();
  const allZero = data.every((d) => d.clicks === 0);

  if (allZero) {
    return (
      <div className="click-analytics__chart-empty">
        <p className="click-analytics__empty">
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

  const axisLabels = [];
  for (let i = 0; i < data.length; i++) {
    if (tickIndices.has(i)) {
      const day = data[i];
      axisLabels.push(
        <span key={day._id}>
          {new Date(day._id + 'T00:00:00').toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          })}
        </span>
      );
    }
  }

  return (
    <div className="click-analytics__chart-plot">
      <div className="click-analytics__chart-bars">
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
              className="click-analytics__chart-bar-col"
              {...hoverHandlers(idx)}
            >
              {isHovered && day.clicks > 0 && (
                <div className="click-analytics__chart-tooltip">
                  <strong>
                    {day.clicks} click
                    {day.clicks !== 1 ? 's' : ''}
                  </strong>
                  <span>{dateLabel}</span>
                </div>
              )}

              {day.clicks > 0 && (
                <span
                  className={`click-analytics__chart-value${isHovered ? ' click-analytics__chart-value--visible' : ''}`}
                >
                  {day.clicks}
                </span>
              )}

              <div className="click-analytics__chart-bar-track">
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
      <div className="click-analytics__chart-axis">{axisLabels}</div>
    </div>
  );
};

export default ClicksChart;
