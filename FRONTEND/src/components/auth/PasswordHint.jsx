const PasswordHint = ({ password, hasError }) => {
  if (hasError) return null;
  if (password.length === 0 || password.length >= 6) return null;
  return (
    <p className="mt-1 text-sm text-muted">
      Password must be at least 6 characters
    </p>
  );
};

export default PasswordHint;
