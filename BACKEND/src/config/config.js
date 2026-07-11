export function resolveSameSite() {
  const override = process.env.COOKIE_SAME_SITE?.trim().toLowerCase();
  if (override === 'lax' || override === 'strict' || override === 'none') {
    return override;
  }

  // Shortly's supported deployment uses same-site frontend/API subdomains.
  // Cross-site deployments must explicitly opt in with COOKIE_SAME_SITE=none.
  return 'lax';
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
