import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchUrlStatsQuery,
  URL_STATS_QUERY_KEY,
  URL_STATS_STALE_TIME
} from './dashboardQueries';

export function useUrlStats(enabled = false) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: URL_STATS_QUERY_KEY,
    queryFn: fetchUrlStatsQuery,
    enabled,
    staleTime: URL_STATS_STALE_TIME
  });
  const { refetch: refetchQuery } = query;

  const refetch = useCallback(() => refetchQuery(), [refetchQuery]);

  const reset = useCallback(() => {
    queryClient.removeQueries({ queryKey: URL_STATS_QUERY_KEY });
  }, [queryClient]);

  return {
    stats: query.data ?? null,
    loading: query.isFetching,
    hasFetched: query.isFetched,
    refetch,
    reset
  };
}
