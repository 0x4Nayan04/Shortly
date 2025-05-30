import axiosinstance from "../utils/axiosInstance";

export const createShortUrl = async (fullUrl) => {
  const response = await axiosinstance.post(`api/create`, {
    full_url: fullUrl,
  });
  return response;
};

export const createCustomShortUrl = async (fullUrl, customAlias) => {
  const response = await axiosinstance.post(`api/create/custom`, {
    full_url: fullUrl,
    custom_url: customAlias,
  });
  return response;
};

export const deleteShortUrl = async (urlId) => {
  const response = await axiosinstance.delete(`api/create/${urlId}`);
  return response;
};

export const getMyUrls = async () => {
  const response = await axiosinstance.get(`api/create/my-urls`);
  return response;
};
