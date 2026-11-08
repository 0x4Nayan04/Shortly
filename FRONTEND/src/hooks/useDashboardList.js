import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { showToast } from '../utils/showToast';
import {
  DASHBOARD_LINKS_STALE_TIME,
  fetchDashboardLinksQuery,
  getDashboardLinksQueryKey
} from './dashboardQueries';

export const useDashboardList = ({ userId, announce, isOnline }) => {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const queryKey = useMemo(
    () =>
      getDashboardLinksQueryKey(userId, {
        page: currentPage,
        search: debouncedSearch,
        sortBy,
        sortOrder
      }),
    [userId, currentPage, debouncedSearch, sortBy, sortOrder]
  );

  const query = useQuery({
    queryKey,
    queryFn: () =>
      fetchDashboardLinksQuery({
        page: currentPage,
        search: debouncedSearch,
        sortBy,
        sortOrder
      }),
    enabled: Boolean(userId && isOnline),
    placeholderData: (previous) => previous,
    staleTime: DASHBOARD_LINKS_STALE_TIME
  });
  const { refetch: refetchQuery } = query;

  useEffect(() => {
    if (query.error) showToast.error('Failed to fetch your links');
  }, [query.error]);

  const setPayload = useCallback(
    (updater) => {
      queryClient.setQueryData(queryKey, (current = {}) => updater(current));
    },
    [queryClient, queryKey]
  );

  const setMyUrls = useCallback(
    (updater) =>
      setPayload((current) => ({
        ...current,
        urls:
          typeof updater === 'function'
            ? updater(current.urls ?? [])
            : updater
      })),
    [setPayload]
  );

  const setTotalCount = useCallback(
    (updater) =>
      setPayload((current) => ({
        ...current,
        totalCount:
          typeof updater === 'function'
            ? updater(current.totalCount ?? 0)
            : updater
      })),
    [setPayload]
  );


  const updateCachedLink = useCallback(
    ({ id, disabled }) => {
      queryClient.setQueriesData(
        { queryKey: ['dashboard-links', userId] },
        (current) => current ? {
          ...current,
          urls: current.urls?.map((url) =>
            url._id === id ? { ...url, disabled } : url
          )
        } : current
      );
    },
    [queryClient, userId]
  );

  const fetchMyUrls = useCallback(async () => {
    if (!isOnline) {
      showToast.error("You're offline. Cannot refresh links.", {
        id: 'dashboard-offline-fetch'
      });
      return;
    }

    await queryClient.invalidateQueries({
      queryKey: ['dashboard-links', userId],
      refetchType: 'none'
    });
    const result = await refetchQuery();
    if (result.data) announce(`Loaded ${result.data.urls?.length || 0} links`);
  }, [announce, isOnline, refetchQuery, queryClient, userId]);

  const handleSearchChange = useCallback((value) => {
    setDebouncedSearch(value);
    setCurrentPage(1);
  }, []);

  const handleSortByChange = useCallback((value) => {
    setSortBy(value);
    setCurrentPage(1);
  }, []);

  const handleSortOrderChange = useCallback((value) => {
    setSortOrder(value);
    setCurrentPage(1);
  }, []);

  const data = query.data ?? {};
  const isInitialLoading = Boolean(
    userId && query.isLoading && !query.isPlaceholderData
  );
  const isRefreshing = Boolean(
    userId && query.isFetching && !isInitialLoading
  );

  return {
    myUrls: data.urls ?? [],
    setMyUrls,
    updateCachedLink,
    loading: isInitialLoading,
    isRefreshing,
    error: query.error ?? null,
    currentPage,
    totalPages: data.totalPages || 1,
    totalCount: data.totalCount || 0,
    setTotalCount,
    debouncedSearch,
    sortBy,
    sortOrder,
    fetchMyUrls,
    loadList: fetchMyUrls,
    handleSearchChange,
    handleSortByChange,
    handleSortOrderChange,
    handlePageChange: setCurrentPage
  };
};
