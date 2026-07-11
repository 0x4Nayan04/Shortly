const STRENGTH_CHECKS = (password) => [
  password.length >= 8,
  /[A-Z]/.test(password),
  /[a-z]/.test(password),
  /[0-9]/.test(password),
  /[^A-Za-z0-9]/.test(password)
];

const getStrengthLabel = (password) => {
  if (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  ) {
    return 'Strong password';
  }
  if (password.length >= 8 && /[A-Z]/.test(password)) {
    return 'Medium password';
  }
  return 'Add uppercase, number, and special char for a stronger password';
};

const PasswordStrengthMeter = ({ password }) => {
  if (password.length < 12) return null;
  const checks = STRENGTH_CHECKS(password);
  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {checks.map((met, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 transition-colors ${
              met ? 'bg-primary' : 'bg-border'
            }`}
          />
        ))}
      </div>
      <p className="mt-1 text-xs text-muted">{getStrengthLabel(password)}</p>
    </div>
  );
};

export default PasswordStrengthMeter;
