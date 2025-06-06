export const cookieOptions = {
  maxAge: 1000 * 60 * 60 * 24, // 1 day
  httpOnly: true,
  secure: process.env.NODE_ENV === "production", // Set to true in production
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // none for cross-origin in production
};
