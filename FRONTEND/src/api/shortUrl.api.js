import axiosinstance from '../utils/axiosInstance';

export const createShortUrl = async (fullUrl) => {
  const payload = {
    full_url: fullUrl
  };

  const { data } = await axiosinstance.post(`api/create`, payload);
  return data;
};

export const createCustomShortUrl = async (fullUrl, customAlias) => {
  const payload = {
    full_url: fullUrl,
    custom_url: customAlias
  };

  const { data } = await axiosinstance.post(`api/create/custom`, payload);
  return data;
};

export const deleteShortUrl = async (urlId) => {
  const { data } = await axiosinstance.delete(`api/create/${urlId}`);
  return data;
};

/**
 * Fetch user's URLs with search, sort, and pagination options
 * @param {Object} options - Query options
 * @param {number} options.limit - Number of URLs to fetch (default: 20)
 * @param {number} options.skip - Number of URLs to skip (default: 0)
 * @param {string} options.search - Search term to filter URLs
 * @param {string} options.sortBy - Field to sort by (createdAt, click, short_url, full_url)
 * @param {string} options.sortOrder - Sort order (asc, desc)
 */
export const getMyUrls = async ({
  limit = 20,
  skip = 0,
  search = '',
  sortBy = 'createdAt',
  sortOrder = 'desc'
} = {}) => {
  const params = new URLSearchParams({
    limit: limit.toString(),
    skip: skip.toString(),
    sortBy,
    sortOrder
  });

  if (search.trim()) {
    params.append('search', search.trim());
  }

  const { data } = await axiosinstance.get(
    `api/create/my-urls?${params.toString()}`
  );
  return data;
};

/**
 * Bulk delete multiple URLs
 * @param {string[]} ids - Array of URL IDs to delete
 */
export const bulkDeleteUrls = async (ids) => {
  const { data } = await axiosinstance.delete(`api/create/bulk`, {
    data: { ids }
  });
  return data;
};

/**
 * Get URL statistics and analytics
 */
export const getUrlStats = async () => {
  const { data } = await axiosinstance.get(`api/create/stats`);
  return data;
};

export const claimAnonymousLinks = async (links) => {
  const { data } = await axiosinstance.post(`api/create/claim`, { links });
  return data;
};

export const updateShortUrl = async (urlId, updates) => {
  const { data } = await axiosinstance.patch(`api/create/${urlId}`, updates);
  return data;
};

export const deleteAnonymousShortUrl = async (urlId, manage_token) => {
  const { data } = await axiosinstance.delete(`api/create/anonymous/${urlId}`, {
    data: { manage_token }
  });
  return data;
};
