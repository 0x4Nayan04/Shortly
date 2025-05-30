import api from "./api";

// Get dashboard analytics for the current user
export const getDashboardAnalytics = async (timeRange = "30d") => {
  try {
    const response = await api.get(
      `/analytics/dashboard?timeRange=${timeRange}`
    );
    return response;
  } catch (error) {
    console.error("Error fetching dashboard analytics:", error);
    throw error;
  }
};

// Get analytics for a specific URL
export const getUrlAnalytics = async (urlId) => {
  try {
    const response = await api.get(`/analytics/url/${urlId}`);
    return response;
  } catch (error) {
    console.error("Error fetching URL analytics:", error);
    throw error;
  }
};

// Get analytics summary for user
export const getAnalyticsSummary = async () => {
  try {
    const response = await api.get("/analytics/summary");
    return response;
  } catch (error) {
    console.error("Error fetching analytics summary:", error);
    throw error;
  }
};
