import axiosinstance from "../utils/axiosInstance";

export const createShortUrl = async (fullUrl, expiresAt = null) => {
  const payload = {
    full_url: fullUrl,
  };

  if (expiresAt) {
    payload.expiresAt = expiresAt;
  }

  const response = await axiosinstance.post(`api/create`, payload);
  return response;
};

export const createCustomShortUrl = async (
  fullUrl,
  customAlias,
  expiresAt = null
) => {
  const payload = {
    full_url: fullUrl,
    custom_url: customAlias,
  };

  if (expiresAt) {
    payload.expiresAt = expiresAt;
  }

  const response = await axiosinstance.post(`api/create/custom`, payload);
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
