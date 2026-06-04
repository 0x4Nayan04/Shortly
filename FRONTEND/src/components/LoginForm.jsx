import { useCallback, useReducer, useRef } from 'react';
import { loginUser, resendVerificationEmail } from '../api/user.api';
import { getApiErrorMessage } from '../utils/axiosInstance';
import { validators } from '../utils/validation';
import { handleApiFormError } from '../utils/apiErrors';
import { useFormValidation } from '../hooks/useFormValidation';
import { useUnsavedNavigationGuard } from '../hooks/useUnsavedNavigationGuard';
import { useOnlineStatus } from './UxEnhancements';
import { ConfirmDialog } from './ux/confirmDialog';
import { showToast } from '../utils/showToast';
import FormAlert from './forms/FormAlert';
import LoginFormFields from './auth/LoginFormFields';
import { loginInitialState, loginReducer } from './auth/loginFormState';

const LoginForm = ({
  onLoginSuccess,
  switchToRegister,
  switchToForgotPassword
}) => {
  const [state, dispatch] = useReducer(loginReducer, loginInitialState);
  const {
    email,
    password,
    loading,
    error,
    showPassword,
    verificationBlocked,
    resendingVerification
  } = state;

  const { isOnline } = useOnlineStatus();
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const getRules = useCallback(
    () => ({
      email: validators.email,
      password: validators.loginPassword
    }),
    []
  );

  const {
    fieldErrors,
    touched,
    handleBlur,
    onFieldChange,
    validateAll,
    mergeFieldErrors,
    resetValidation
  } = useFormValidation(['email', 'password'], getRules);

  const hasUnsavedChanges = !loading && (email || password);
  const unsavedDialog = useUnsavedNavigationGuard(hasUnsavedChanges);

  const focusFirstInvalid = (errors) => {
    if (errors.email || !email) {
      emailRef.current?.focus();
    } else if (errors.password || !password) {
      passwordRef.current?.focus();
    }
  };

  const handleLoginResponse = (response) => {
    if (!response || response.success === false || !response.user) {
      const message = response?.message || 'Login failed';
      dispatch({ type: 'LOGIN_FAILURE', error: message });
      showToast.error(message);
      return;
    }
    if (onLoginSuccess) onLoginSuccess(response);
    dispatch({ type: 'LOGIN_SUCCESS' });
    resetValidation();
  };

  const handleVerificationBlocked = () => {
    dispatch({ type: 'SET_VERIFICATION_BLOCKED', value: true });
    mergeFieldErrors({ email: 'Verify your email before signing in.' });
  };

  const handleLoginError = (err) => {
    const data = err?.response ? err.response.data : err;
    if (data && typeof data === 'object' && Array.isArray(data.errors)) {
      dispatch({ type: 'SET_LOADING', value: false });
    }
    handleApiFormError(
      err,
      {
        setError: (errorMsg) => {
          dispatch({ type: 'LOGIN_FAILURE', error: errorMsg });
          if (err?.response?.status === 403 && /verify/i.test(errorMsg)) {
            handleVerificationBlocked();
          }
        },
        mergeFieldErrors
      },
      {
        fallbackMessage: 'Invalid email or password',
        formMessage: 'Please check your credentials.'
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isOnline) {
      showToast.error("You're offline. Cannot sign in.");
      return;
    }

    const { valid, errors } = validateAll({ email, password });
    if (!valid) {
      showToast.error('Please fill in all required fields.');
      focusFirstInvalid(errors);
      return;
    }

    dispatch({ type: 'LOGIN_START' });

    try {
      const response = await loginUser(email, password);
      handleLoginResponse(response);
    } catch (err) {
      handleLoginError(err);
    }
  };

  const handleResendVerification = async () => {
    if (!email.trim()) {
      showToast.error('Enter your email address first.');
      emailRef.current?.focus();
      return;
    }

    if (!isOnline) {
      showToast.error("You're offline. Cannot resend verification email.");
      return;
    }

    dispatch({ type: 'SET_RESENDING_VERIFICATION', value: true });
    try {
      const response = await resendVerificationEmail(email.trim());
      showToast.success(
        response.message ||
          'If your account needs verification, a new link has been sent.'
      );
    } catch (err) {
      showToast.error(
        getApiErrorMessage(err, 'Failed to resend verification email.')
      );
    } finally {
      dispatch({ type: 'SET_RESENDING_VERIFICATION', value: false });
    }
  };

  return (
    <div className="app-panel">
      <div className="mb-6 text-center">
        <h2
          id="login-heading"
          className="font-display text-xl font-medium tracking-display text-ink sm:text-2xl"
        >
          Welcome back
        </h2>
        <p className="mt-2 text-muted-strong">Sign in to your account</p>
      </div>

      <LoginFormFields
        dispatch={dispatch}
        email={email}
        password={password}
        fieldErrors={fieldErrors}
        touched={touched}
        handleBlur={handleBlur}
        onFieldChange={onFieldChange}
        showPassword={showPassword}
        verificationBlocked={verificationBlocked}
        resendingVerification={resendingVerification}
        loading={loading}
        onSubmit={handleSubmit}
        onResendVerification={handleResendVerification}
        emailRef={emailRef}
        passwordRef={passwordRef}
      />

      <FormAlert error={error} />

      <ConfirmDialog {...unsavedDialog} />

      <div className="mt-6 space-y-2 text-center">
        <button
          type="button"
          onClick={switchToForgotPassword}
          className="landing-text-link block w-full text-sm"
        >
          Forgot your password?
        </button>
        <p className="text-sm text-muted-strong">
          Don&apos;t have an account?{' '}
          <button
            type="button"
            onClick={switchToRegister}
            className="landing-text-link font-medium"
          >
            Sign up here
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
