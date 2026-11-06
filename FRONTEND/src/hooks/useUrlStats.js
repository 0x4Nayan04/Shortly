import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchUrlStatsAnalyticsQuery,
  fetchUrlStatsOverviewQuery,
  URL_STATS_ANALYTICS_QUERY_KEY,
  URL_STATS_OVERVIEW_QUERY_KEY,
  URL_STATS_STALE_TIME
} from './dashboardQueries';

export function useUrlStats(enabled = false) {
  const queryClient = useQueryClient();

  const overview = useQuery({
    queryKey: URL_STATS_OVERVIEW_QUERY_KEY,
    queryFn: fetchUrlStatsOverviewQuery,
    enabled,
    staleTime: URL_STATS_STALE_TIME
  });

  const analytics = useQuery({
    queryKey: URL_STATS_ANALYTICS_QUERY_KEY,
    queryFn: fetchUrlStatsAnalyticsQuery,
    enabled,
    staleTime: URL_STATS_STALE_TIME
  });

  const stats = useMemo(() => {
    if (!overview.data) return null;
    return {
      ...overview.data,
      clickAnalytics: analytics.data?.clickAnalytics ?? null
    };
  }, [overview.data, analytics.data]);

  const refetchOverview = overview.refetch;
  const refetchAnalytics = analytics.refetch;

  const refetch = useCallback(async () => {
    await Promise.all([refetchOverview(), refetchAnalytics()]);
  }, [refetchOverview, refetchAnalytics]);

  const reset = useCallback(() => {
    queryClient.removeQueries({ queryKey: ['url-stats'] });
  }, [queryClient]);

  return {
    stats,
    loading: overview.isLoading,
    hasFetched: overview.isFetched,
    refetch,
    refetchOverview,
    reset
  };
}
