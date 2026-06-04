import AuthSubmitButton from '../AuthSubmitButton';
import FormField from '../forms/FormField';
import PasswordField from '../forms/PasswordField';

const LoginFormFields = ({
  dispatch,
  email,
  password,
  fieldErrors,
  touched,
  handleBlur,
  onFieldChange,
  showPassword,
  verificationBlocked,
  resendingVerification,
  loading,
  onSubmit,
  onResendVerification,
  emailRef,
  passwordRef
}) => (
  <form
    onSubmit={onSubmit}
    className="space-y-4"
    aria-labelledby="login-heading"
  >
    <div ref={emailRef}>
      <FormField
        id="login-email"
        label="Email address"
        type="email"
        value={email}
        onChange={(e) => {
          dispatch({
            type: 'SET_FIELD',
            field: 'email',
            value: e.target.value
          });
          onFieldChange(
            'email',
            { email: e.target.value, password },
            {
              clearError: () => dispatch({ type: 'SET_ERROR', value: '' })
            }
          );
        }}
        onBlur={(e) => handleBlur('email', { email: e.target.value, password })}
        error={fieldErrors.email}
        touched={touched.email}
        placeholder="Enter your email"
        autoComplete="email"
      />
    </div>

    <div ref={passwordRef}>
      <PasswordField
        id="login-password"
        label="Password"
        value={password}
        onChange={(e) => {
          dispatch({
            type: 'SET_FIELD',
            field: 'password',
            value: e.target.value
          });
          onFieldChange(
            'password',
            { email, password: e.target.value },
            {
              clearError: () => dispatch({ type: 'SET_ERROR', value: '' })
            }
          );
        }}
        onBlur={(e) =>
          handleBlur('password', { email, password: e.target.value })
        }
        error={fieldErrors.password}
        touched={touched.password}
        placeholder="Enter your password"
        autoComplete="current-password"
        showPassword={showPassword}
        onToggleVisibility={() => dispatch({ type: 'TOGGLE_PASSWORD' })}
      />
    </div>

    {verificationBlocked && (
      <button
        type="button"
        onClick={onResendVerification}
        disabled={resendingVerification}
        className="sm-btn sm-btn-secondary sm-btn-block disabled:opacity-50"
      >
        {resendingVerification ? 'Sending…' : 'Resend verification email'}
      </button>
    )}

    <AuthSubmitButton loading={loading} loadingLabel="Signing in…">
      Sign in
    </AuthSubmitButton>
  </form>
);

export default LoginFormFields;
