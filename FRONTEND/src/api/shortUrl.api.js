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

export const getMyUrls = async (limit = 20, skip = 0) => {
  const response = await axiosinstance.get(`api/create/my-urls?limit=${limit}&skip=${skip}`);
  return response;
};
