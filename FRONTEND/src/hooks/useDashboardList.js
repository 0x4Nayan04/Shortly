import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getMyUrls } from '../api/shortUrl.api';
import { showToast } from '../utils/showToast';
import { getApiPayload } from '../utils/axiosInstance';

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;

const fetchDashboardLinks = async ({ page, search, sortBy, sortOrder }) => {
  const response = await getMyUrls({
    limit: PAGE_SIZE,
    skip: (page - 1) * PAGE_SIZE,
    search,
    sortBy,
    sortOrder
  });
  return getApiPayload(response) ?? {};
};

export const useDashboardList = ({ userId, announce, isOnline }) => {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const searchDebounceRef = useRef(null);

  const queryKey = useMemo(
    () => [
      'dashboard-links',
      userId,
      currentPage,
      debouncedSearch,
      sortBy,
      sortOrder
    ],
    [userId, currentPage, debouncedSearch, sortBy, sortOrder]
  );

  const query = useQuery({
    queryKey,
    queryFn: () =>
      fetchDashboardLinks({
        page: currentPage,
        search: debouncedSearch,
        sortBy,
        sortOrder
      }),
    enabled: Boolean(userId && isOnline),
    placeholderData: (previous) => previous,
    staleTime: 15_000
  });
  const { refetch: refetchQuery } = query;

  useEffect(
    () => () => clearTimeout(searchDebounceRef.current),
    []
  );

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

  const fetchMyUrls = useCallback(async () => {
    if (!isOnline) {
      showToast.error("You're offline. Cannot refresh links.", {
        id: 'dashboard-offline-fetch'
      });
      return;
    }
    const result = await refetchQuery();
    if (result.data) announce(`Loaded ${result.data.urls?.length || 0} links`);
  }, [announce, isOnline, refetchQuery]);

  const handleSearchChange = useCallback((value) => {
    setSearch(value);
    setCurrentPage(1);
    clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(
      () => setDebouncedSearch(value),
      SEARCH_DEBOUNCE_MS
    );
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

  return {
    myUrls: data.urls ?? [],
    setMyUrls,
    loading: Boolean(userId && query.isFetching),
    error: query.error ?? null,
    currentPage,
    totalPages: data.totalPages || 1,
    totalCount: data.totalCount || 0,
    setTotalCount,
    search,
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
