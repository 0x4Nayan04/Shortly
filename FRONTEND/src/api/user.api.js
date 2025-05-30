import axiosinstance from "../utils/axiosInstance";

export const loginUser = async (email, password) => {
  const { data } = await axiosinstance.post(`api/auth/login`, {
    email,
    password,
  });
  return data;
};

export const registerUser = async (name, email, password) => {
  const { data } = await axiosinstance.post(`api/auth/register`, {
    name,
    email,
    password,
  });
  return data;
};

export const logoutUser = async () => {
  const { data } = await axiosinstance.get(`api/auth/logout`);
  return data;
};

export const getCurrentUser = async () => {
  const { data } = await axiosinstance.get(`api/auth/me`);
  return data;
};
