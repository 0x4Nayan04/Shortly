import axiosinstance from "../utils/axiosInstance";

export const createShortUrl = async (fullUrl) => {
  const response = await axiosinstance.post(`api/create`, {
    full_url: fullUrl,
  });
  return response;
};

export const getMyUrls = async () => {
  const response = await axiosinstance.get(`api/create/my-urls`);
  return response;
};
