import { useCallback, useState } from 'react';
import { getUrlStats } from '../api/shortUrl.api';
import { getApiPayload } from '../utils/axiosInstance';

export function useUrlStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    setLoading(true);
    const response = await getUrlStats().catch(() => null);
    const payload = response ? getApiPayload(response) : null;
    if (payload) setStats(payload);
    setLoading(false);
  }, []);

  return { stats, loading, refetch };
}
