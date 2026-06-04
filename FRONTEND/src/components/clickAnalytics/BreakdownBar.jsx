const BreakdownBar = ({ label, count, total }) => {
  const sharePct = total > 0 ? (count / total) * 100 : 0;
  const displayPct = Math.round(sharePct);
  const displayLabel = label ? label : 'Unknown / Local';

  return (
    <div className="click-analytics__breakdown-row">
      <span className="click-analytics__breakdown-label" title={displayLabel}>
        {displayLabel}
      </span>
      <div className="click-analytics__breakdown-track">
        <div
          className="click-analytics__breakdown-fill"
          style={{ width: `${sharePct}%` }}
          role="presentation"
        />
      </div>
      <span className="click-analytics__breakdown-count tabular-nums">
        {count}
      </span>
      <span className="click-analytics__breakdown-pct tabular-nums">
        {displayPct}%
      </span>
    </div>
  );
};

const BreakdownList = ({ data, total }) => {
  if (!data || data.length === 0) {
    return <p className="click-analytics__empty">No data available yet</p>;
  }

  return (
    <div className="click-analytics__breakdown-list">
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

export const CountriesBreakdown = ({ data, total }) => {
  const hasRows = Array.isArray(data) && data.length > 0;
  const showMoreDataHint = hasRows && data.length < 3;

  return (
    <>
      <BreakdownList data={data} total={total} />
      {showMoreDataHint && (
        <p className="click-analytics__countries-empty-state">
          More data appears as your links get clicks from different locations.
        </p>
      )}
    </>
  );
};

export const PlatformGroup = ({ title, data, total }) => (
  <section
    className="click-analytics__platform-group"
    aria-labelledby={`click-analytics-platform-${title.replace(/\s+/g, '-').toLowerCase()}`}
  >
    <h5
      id={`click-analytics-platform-${title.replace(/\s+/g, '-').toLowerCase()}`}
      className="click-analytics__platform-title"
    >
      {title}
    </h5>
    <BreakdownList data={data} total={total} />
  </section>
);
