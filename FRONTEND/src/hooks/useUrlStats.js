import { useCallback, useState } from 'react';
import { getUrlStats } from '../api/shortUrl.api';
import { getApiPayload } from '../utils/axiosInstance';

export function useUrlStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getUrlStats();
      const payload = getApiPayload(response);
      if (payload) setStats(payload);
    } catch {
      setStats(null);
    } finally {
      setHasFetched(true);
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setStats(null);
    setHasFetched(false);
    setLoading(false);
  }, []);

  return {
    stats,
    loading,
    hasFetched,
    refetch,
    reset
  };
}
