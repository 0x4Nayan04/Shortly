import axiosinstance from '../utils/axiosInstance';

export const fetchAbuseReports = async ({
  status,
  limit = 20,
  skip = 0
} = {}) => {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  params.set('limit', String(limit));
  params.set('skip', String(skip));

  const { data } = await axiosinstance.get(
    `/api/admin/abuse/reports?${params.toString()}`
  );
  return data;
};

export const updateAbuseReport = async (id, updates) => {
  const { data } = await axiosinstance.patch(
    `/api/admin/abuse/reports/${id}`,
    updates
  );
  return data;
};

export const retireAbuseReport = async (id) => {
  const { data } = await axiosinstance.post(
    `/api/admin/abuse/reports/${id}/retire`
  );
  return data;
};
