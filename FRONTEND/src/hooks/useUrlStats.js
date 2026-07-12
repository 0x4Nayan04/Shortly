import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getUrlStats } from '../api/shortUrl.api';
import { getApiPayload } from '../utils/axiosInstance';

const STATS_QUERY_KEY = ['url-stats'];

export function useUrlStats(enabled = false) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: STATS_QUERY_KEY,
    queryFn: async () => getApiPayload(await getUrlStats()) ?? null,
    enabled,
    staleTime: 30_000
  });
  const { refetch: refetchQuery } = query;

  const refetch = useCallback(() => refetchQuery(), [refetchQuery]);

  const reset = useCallback(() => {
    queryClient.removeQueries({ queryKey: STATS_QUERY_KEY });
  }, [queryClient]);

  return {
    stats: query.data ?? null,
    loading: query.isFetching,
    hasFetched: query.isFetched,
    refetch,
    reset
  };
}
