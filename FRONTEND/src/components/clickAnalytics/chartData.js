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

export const getChartDataForRange = (data = [], range = '7d') => {
  const normalizedData = normalizeDailyClicks(data);

  if (range === 'all') {
    const firstClickKey = normalizedData.find((day) => day.clicks > 0)?._id;
    return fillDateRange(normalizedData, firstClickKey || getTodayKey());
  }

  return fillMissingDays(normalizedData, range === '30d' ? 30 : 7);
};

export const rangeOptions = [
  { value: '7d', label: '7D', subtitle: 'Last 7 days' },
  { value: '30d', label: '30D', subtitle: 'Last 30 days' },
  {
    value: 'all',
    label: 'Available',
    subtitle: 'Since first click',
    title: 'Every stored day from your first click — up to 30 days of records'
  }
];
