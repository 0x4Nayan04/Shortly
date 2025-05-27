import axiosinstance from "../utils/axiosInstance";

export const createShortUrl = async (fullUrl) => {
  const response = await axiosinstance.post(`api/create`, {
    full_url: fullUrl,
  });
  return response;
};
