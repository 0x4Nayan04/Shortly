import { useCallback, useRef, useState } from 'react';
import AuthSubmitButton from './AuthSubmitButton';
import { loginUser, resendVerificationEmail } from '../api/user.api';
import { getApiErrorMessage } from '../utils/axiosInstance';
import {
  formAlertClass,
  getDesignInputClass
} from '../utils/designFormClasses';
import { validators } from '../utils/validation';
import { useFormValidation } from '../hooks/useFormValidation';
import { useUnsavedNavigationGuard } from '../hooks/useUnsavedNavigationGuard';
import PasswordVisibilityToggle from './PasswordVisibilityToggle';
import { showToast, useOnlineStatus, ConfirmDialog } from './UxEnhancements';

const LoginForm = ({
  onLoginSuccess,
  switchToRegister,
  switchToForgotPassword
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [verificationBlocked, setVerificationBlocked] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isOnline) {
      showToast.error("You're offline. Cannot sign in.");
      return;
    }

    const values = { email, password };
    const { valid, errors } = validateAll(values);
    if (!valid) {
      showToast.error('Please fill in all required fields.');
      if (errors.email || !email) {
        emailRef.current?.focus();
      } else if (errors.password || !password) {
        passwordRef.current?.focus();
      }
      return;
    }

    setLoading(true);
    setError('');
    setVerificationBlocked(false);

    try {
      const response = await loginUser(email, password);

      if (response.success !== false && response.user) {
        if (onLoginSuccess) {
          onLoginSuccess(response);
        }

        setEmail('');
        setPassword('');
        resetValidation();
      } else {
        setError(response.message || 'Login failed');
        showToast.error(response.message || 'Login failed');
      }
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response ? err.response.data : err;
      if (data && typeof data === 'object' && Array.isArray(data.errors)) {
        const backendErrors = {};
        data.errors.forEach((e) => {
          backendErrors[e.field] = e.message;
        });
        mergeFieldErrors(backendErrors);
        showToast.error('Please check your credentials.');
      } else {
        const errorMsg = getApiErrorMessage(err, 'Invalid email or password');
        setError(errorMsg);
        showToast.error(errorMsg);
        if (status === 403 && /verify/i.test(errorMsg)) {
          setVerificationBlocked(true);
          mergeFieldErrors({ email: 'Verify your email before signing in.' });
        }
      }
    } finally {
      setLoading(false);
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

    setResendingVerification(true);
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
      setResendingVerification(false);
    }
  };

  return (
    <div className='app-panel'>
      <div className='mb-6 text-center'>
        <h2
          id='login-heading'
          className='font-display text-xl font-medium tracking-display text-ink sm:text-2xl'>
          Welcome back
        </h2>
        <p className='mt-2 text-muted-strong'>Sign in to your account</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className='space-y-4'
        aria-labelledby='login-heading'>
        <div>
          <label
            htmlFor='login-email'
            className='sm-label'>
            Email address
          </label>
          <input
            ref={emailRef}
            id='login-email'
            type='email'
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              onFieldChange(
                'email',
                { email: e.target.value, password },
                {
                  clearError: () => setError('')
                }
              );
            }}
            onBlur={(e) =>
              handleBlur('email', { email: e.target.value, password })
            }
            placeholder='Enter your email'
            className={getDesignInputClass({
              hasError: touched.email && fieldErrors.email
            })}
            aria-invalid={touched.email && fieldErrors.email ? 'true' : 'false'}
            aria-describedby={
              fieldErrors.email ? 'login-email-error' : undefined
            }
            autoComplete='email'
          />
          {touched.email && fieldErrors.email && (
            <p
              id='login-email-error'
              className='sm-field-error'
              role='alert'>
              {fieldErrors.email}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor='login-password'
            className='sm-label'>
            Password
          </label>
          <div className='relative'>
            <input
              ref={passwordRef}
              id='login-password'
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                onFieldChange(
                  'password',
                  { email, password: e.target.value },
                  { clearError: () => setError('') }
                );
              }}
              onBlur={(e) =>
                handleBlur('password', { email, password: e.target.value })
              }
              placeholder='Enter your password'
              className={getDesignInputClass({
                hasError: touched.password && fieldErrors.password,
                className: 'pr-12'
              })}
              aria-invalid={
                touched.password && fieldErrors.password ? 'true' : 'false'
              }
              aria-describedby={
                fieldErrors.password ? 'login-password-error' : undefined
              }
              autoComplete='current-password'
            />
            <PasswordVisibilityToggle
              visible={showPassword}
              onToggle={() => setShowPassword(!showPassword)}
            />
          </div>
          {touched.password && fieldErrors.password && (
            <p
              id='login-password-error'
              className='sm-field-error'
              role='alert'>
              {fieldErrors.password}
            </p>
          )}
        </div>

        <div className='flex justify-end'>
          <button
            type='button'
            onClick={switchToForgotPassword}
            className='landing-text-link text-sm'>
            Forgot password?
          </button>
        </div>

        <AuthSubmitButton
          loading={loading}
          loadingLabel='Signing in…'>
          Sign in
        </AuthSubmitButton>
      </form>

      {error && (
        <div
          className={formAlertClass}
          role='alert'
          aria-live='assertive'>
          {error}
        </div>
      )}

      {verificationBlocked && (
        <div className='mt-4 text-center'>
          <p className='text-sm text-muted-strong mb-3'>
            Didn&apos;t get the email? Check spam, or request a new link.
          </p>
          <button
            type='button'
            onClick={handleResendVerification}
            disabled={resendingVerification}
            className='landing-text-link text-sm font-medium disabled:opacity-50'>
            {resendingVerification ? 'Sending…' : 'Resend verification email'}
          </button>
        </div>
      )}

      <ConfirmDialog {...unsavedDialog} />

      <div className='mt-6 text-center'>
        <p className='text-sm text-muted-strong'>
          Don&apos;t have an account?{' '}
          <button
            type='button'
            onClick={switchToRegister}
            className='landing-text-link font-medium'>
            Sign up here
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
