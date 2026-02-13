import axiosinstance from "../utils/axiosInstance";

export const createShortUrl = async (fullUrl) => {
  const payload = {
    full_url: fullUrl,
  };

  const response = await axiosinstance.post(`api/create`, payload);
  return response;
};

export const createCustomShortUrl = async (fullUrl, customAlias) => {
  const payload = {
    full_url: fullUrl,
    custom_url: customAlias,
  };

  const response = await axiosinstance.post(`api/create/custom`, payload);
  return response;
};

export const deleteShortUrl = async (urlId) => {
  const response = await axiosinstance.delete(`api/create/${urlId}`);
  return response;
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
  search = "",
  sortBy = "createdAt",
  sortOrder = "desc",
} = {}) => {
  const params = new URLSearchParams({
    limit: limit.toString(),
    skip: skip.toString(),
    sortBy,
    sortOrder,
  });

  if (search.trim()) {
    params.append("search", search.trim());
  }

  const response = await axiosinstance.get(`api/create/my-urls?${params.toString()}`);
  return response;
};

/**
 * Bulk delete multiple URLs
 * @param {string[]} ids - Array of URL IDs to delete
 */
export const bulkDeleteUrls = async (ids) => {
  const response = await axiosinstance.delete(`api/create/bulk`, {
    data: { ids },
  });
  return response;
};

/**
 * Get URL statistics and analytics
 */
export const getUrlStats = async () => {
  const response = await axiosinstance.get(`api/create/stats`);
  return response;
};
