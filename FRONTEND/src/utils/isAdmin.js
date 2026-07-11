/** @param {string | undefined} email */
export const isAdminUser = (email) => {
  if (!email) return false;
  const raw = import.meta.env.VITE_ADMIN_EMAILS?.trim();
  if (!raw) return false;
  const normalized = String(email).trim().toLowerCase();
  return raw
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
    .includes(normalized);
};
