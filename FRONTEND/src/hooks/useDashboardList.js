import { useCallback, useRef, useState } from 'react';
import { getMyUrls } from '../api/shortUrl.api';
import { showToast } from '../utils/showToast';
import { getApiPayload } from '../utils/axiosInstance';

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;

export const useDashboardList = ({ userId, announce, isOnline }) => {
  const [myUrls, setMyUrls] = useState([]);
  const [loading, setLoading] = useState(Boolean(userId));
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const searchDebounceRef = useRef(null);

  const fetchUrls = useCallback(
    async (
      {
        page,
        search: activeSearch,
        sortBy: activeSortBy,
        sortOrder: activeSortOrder
      },
      { notifyOffline = false, notifyAnnounce = false } = {}
    ) => {
      setLoading(true);
      setError(null);

      if (!isOnline) {
        if (notifyOffline) {
          showToast.error("You're offline. Cannot refresh links.", {
            id: 'dashboard-offline-fetch'
          });
        }
        setLoading(false);
        return;
      }

      try {
        const skip = (page - 1) * PAGE_SIZE;
        const response = await getMyUrls({
          limit: PAGE_SIZE,
          skip,
          search: activeSearch,
          sortBy: activeSortBy,
          sortOrder: activeSortOrder
        });
        const payload = getApiPayload(response);
        if (payload) {
          const { urls, totalCount: total, totalPages: pages } = payload;
          setMyUrls(urls || []);
          setTotalCount(total || 0);
          setTotalPages(pages || 1);
          if (notifyAnnounce) {
            announce(`Loaded ${urls?.length || 0} links`);
          }
        }
      } catch (err) {
        setError(err);
        showToast.error('Failed to fetch your links');
        if (notifyAnnounce) {
          announce('Error loading links');
        }
      } finally {
        setLoading(false);
      }
    },
    [announce, isOnline]
  );

  const loadList = useCallback(
    (overrides = {}, options = {}) => {
      if (!userId) return Promise.resolve();
      return fetchUrls(
        {
          page: currentPage,
          search: debouncedSearch,
          sortBy,
          sortOrder,
          ...overrides
        },
        options
      );
    },
    [userId, fetchUrls, currentPage, debouncedSearch, sortBy, sortOrder]
  );

  const fetchMyUrls = useCallback(() => {
    return loadList({}, { notifyOffline: true, notifyAnnounce: true });
  }, [loadList]);

  const handleSearchChange = useCallback(
    (value) => {
      setSearch(value);
      setCurrentPage(1);
      clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = setTimeout(() => {
        setDebouncedSearch(value);
        if (!userId) return;
        fetchUrls({
          page: 1,
          search: value,
          sortBy,
          sortOrder
        });
      }, SEARCH_DEBOUNCE_MS);
    },
    [userId, fetchUrls, sortBy, sortOrder]
  );

  const handleSortByChange = useCallback(
    (value) => {
      setSortBy(value);
      setCurrentPage(1);
      if (!userId) return;
      fetchUrls({
        page: 1,
        search: debouncedSearch,
        sortBy: value,
        sortOrder
      });
    },
    [userId, fetchUrls, debouncedSearch, sortOrder]
  );

  const handleSortOrderChange = useCallback(
    (value) => {
      setSortOrder(value);
      setCurrentPage(1);
      if (!userId) return;
      fetchUrls({
        page: 1,
        search: debouncedSearch,
        sortBy,
        sortOrder: value
      });
    },
    [userId, fetchUrls, debouncedSearch, sortBy]
  );

  const handlePageChange = useCallback(
    (page) => {
      setCurrentPage(page);
      if (!userId) return;
      fetchUrls({
        page,
        search: debouncedSearch,
        sortBy,
        sortOrder
      });
    },
    [userId, fetchUrls, debouncedSearch, sortBy, sortOrder]
  );

  return {
    myUrls,
    setMyUrls,
    loading: userId ? loading : false,
    error,
    currentPage,
    totalPages,
    totalCount,
    setTotalCount,
    search,
    debouncedSearch,
    sortBy,
    sortOrder,
    fetchMyUrls,
    loadList,
    handleSearchChange,
    handleSortByChange,
    handleSortOrderChange,
    handlePageChange
  };
};
