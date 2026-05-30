function resolveSameSite() {
  const override = process.env.COOKIE_SAME_SITE?.trim().toLowerCase();
  if (override === 'lax' || override === 'strict' || override === 'none') {
    return override;
  }

  if (process.env.NODE_ENV !== 'production') {
    return 'lax';
  }

  try {
    const front = new URL(process.env.FRONT_END_URL);
    const apiBase =
      process.env.PUBLIC_BASE_URL?.trim() ||
      `http://127.0.0.1:${process.env.PORT || 3001}`;
    const api = new URL(apiBase);
    return front.hostname === api.hostname ? 'lax' : 'none';
  } catch {
    return 'lax';
  }
}

const sameSite = resolveSameSite();
const isProduction = process.env.NODE_ENV === 'production';

export const cookieOptions = {
  maxAge: 1000 * 60 * 60 * 24,
  httpOnly: true,
  secure: isProduction || sameSite === 'none',
  sameSite,
  path: '/'
};
