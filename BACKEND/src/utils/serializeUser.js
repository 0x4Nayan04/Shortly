const PRIVATE_USER_FIELDS = new Set([
  'password',
  'resetPasswordToken',
  'resetPasswordExpires',
  'emailVerificationToken',
  'emailVerificationExpires',
  'tokenVersion',
  '__v'
]);

export function serializeUser(user) {
  if (!user) return null;

  const raw = typeof user.toJSON === 'function' ? user.toJSON() : { ...user };

  for (const field of PRIVATE_USER_FIELDS) {
    delete raw[field];
  }

  return raw;
}
