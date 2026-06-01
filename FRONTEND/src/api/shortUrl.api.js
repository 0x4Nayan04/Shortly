import axiosinstance from '../utils/axiosInstance';

export const createShortUrl = async (fullUrl) => {
  const payload = {
    full_url: fullUrl
  };

  const { data } = await axiosinstance.post(`/api/create`, payload);
  return data;
};

export const createCustomShortUrl = async (fullUrl, customAlias) => {
  const payload = {
    full_url: fullUrl,
    custom_url: customAlias
  };

  const { data } = await axiosinstance.post(`/api/create/custom`, payload);
  return data;
};

export const deleteShortUrl = async (urlId) => {
  const { data } = await axiosinstance.delete(`/api/create/${urlId}`);
  return data;
};

export const updateShortUrl = async (urlId, updates) => {
  const { data } = await axiosinstance.patch(`/api/create/${urlId}`, updates);
  return data;
};

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
    `/api/create/my-urls?${params.toString()}`
  );
  return data;
};

export const bulkDeleteUrls = async (ids) => {
  const { data } = await axiosinstance.delete(`/api/create/bulk`, {
    data: { ids }
  });
  return data;
};

export const getUrlStats = async () => {
  const { data } = await axiosinstance.get(`/api/create/stats`);
  return data;
};

export const claimAnonymousLinks = async (links) => {
  const { data } = await axiosinstance.post(`/api/create/claim`, { links });
  return data;
};
