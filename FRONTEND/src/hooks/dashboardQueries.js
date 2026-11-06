import { getMyUrls, getUrlClickAnalytics, getUrlStats } from '../api/shortUrl.api';
import { ROUTES } from '../constants/routes';
import { queryClient } from '../queryClient';
import { getApiPayload } from '../utils/axiosInstance';

export const URL_STATS_OVERVIEW_QUERY_KEY = ['url-stats', 'overview'];
export const URL_STATS_ANALYTICS_QUERY_KEY = ['url-stats', 'analytics'];
export const URL_STATS_STALE_TIME = 30_000;

export const DASHBOARD_PAGE_SIZE = 10;
export const DASHBOARD_LINKS_STALE_TIME = 15_000;

export const DEFAULT_DASHBOARD_LIST_PARAMS = {
  page: 1,
  search: '',
  sortBy: 'createdAt',
  sortOrder: 'desc'
};

export const fetchUrlStatsOverviewQuery = async () =>
  getApiPayload(await getUrlStats()) ?? null;

export const fetchUrlStatsAnalyticsQuery = async () =>
  getApiPayload(await getUrlClickAnalytics()) ?? null;

export const getDashboardLinksQueryKey = (
  userId,
  {
    page = DEFAULT_DASHBOARD_LIST_PARAMS.page,
    search = DEFAULT_DASHBOARD_LIST_PARAMS.search,
    sortBy = DEFAULT_DASHBOARD_LIST_PARAMS.sortBy,
    sortOrder = DEFAULT_DASHBOARD_LIST_PARAMS.sortOrder
  } = {}
) => ['dashboard-links', userId, page, search, sortBy, sortOrder];

export const fetchDashboardLinksQuery = async ({
  page,
  search,
  sortBy,
  sortOrder
}) => {
  const response = await getMyUrls({
    limit: DASHBOARD_PAGE_SIZE,
    skip: (page - 1) * DASHBOARD_PAGE_SIZE,
    search,
    sortBy,
    sortOrder
  });
  return getApiPayload(response) ?? {};
};

/** Prefetch link list only — stats are owned by useUrlStats to avoid a double GET. */
export function prefetchDashboardQueries(userId) {
  if (!userId || window.location.pathname !== ROUTES.DASHBOARD) return;

  void queryClient.prefetchQuery({
    queryKey: getDashboardLinksQueryKey(userId),
    queryFn: () => fetchDashboardLinksQuery(DEFAULT_DASHBOARD_LIST_PARAMS),
    staleTime: DASHBOARD_LINKS_STALE_TIME
  });
}
