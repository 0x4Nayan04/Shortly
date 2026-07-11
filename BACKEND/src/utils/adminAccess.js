const parseAdminEmails = () => {
  const raw = process.env.ADMIN_EMAILS?.trim();
  if (!raw) return new Set();
  return new Set(
    raw
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
};

let cachedAdminEmails = null;

export const getAdminEmails = () => {
  if (!cachedAdminEmails) {
    cachedAdminEmails = parseAdminEmails();
  }
  return cachedAdminEmails;
};

export const isAdminEmail = (email) => {
  if (!email) return false;
  return getAdminEmails().has(String(email).trim().toLowerCase());
};

/** Test helper — resets cached admin list after env changes. */
export const resetAdminEmailCache = () => {
  cachedAdminEmails = null;
};
