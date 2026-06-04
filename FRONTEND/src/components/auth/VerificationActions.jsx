const VerificationActions = ({ resending, onResend, onSwitchToLogin }) => (
  <>
    <button
      type="button"
      onClick={onResend}
      disabled={resending}
      className="sm-btn sm-btn-secondary disabled:opacity-50"
    >
      {resending ? 'Sending…' : 'Resend verification email'}
    </button>
    <button
      type="button"
      onClick={onSwitchToLogin}
      className="sm-btn sm-btn-primary"
    >
      Go to sign in
    </button>
  </>
);

export default VerificationActions;
