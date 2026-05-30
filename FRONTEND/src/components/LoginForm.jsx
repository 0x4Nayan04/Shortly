import { useEffect, useRef, useState } from 'react';
import { useBlocker } from 'react-router-dom';
import AuthSubmitButton from './AuthSubmitButton';
import { loginUser } from '../api/user.api';
import { getApiErrorMessage } from '../utils/axiosInstance';
import {
  formAlertClass,
  getDesignInputClass
} from '../utils/designFormClasses';
import { validators } from '../utils/validation';
import PasswordVisibilityToggle from './PasswordVisibilityToggle';
import {
  showToast,
  useOnlineStatus,
  useUnsavedChanges,
  useConfirmDialog,
  ConfirmDialog
} from './UxEnhancements';

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
  const { isOnline } = useOnlineStatus();
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const hasUnsavedChanges = !loading && (email || password);
  useUnsavedChanges(hasUnsavedChanges);
  const navigationBlocker = useBlocker(hasUnsavedChanges);
  const unsavedDialog = useConfirmDialog();

  useEffect(() => {
    if (navigationBlocker.state === 'blocked') {
      unsavedDialog
        .confirm({
          title: 'Unsaved changes',
          message: 'You have unsaved changes. Are you sure you want to leave?',
          confirmLabel: 'Leave',
          cancelLabel: 'Stay',
          variant: 'danger'
        })
        .then((confirmed) => {
          if (confirmed) {
            navigationBlocker.proceed();
          } else {
            navigationBlocker.reset();
          }
        });
    }
  }, [navigationBlocker.state]); // eslint-disable-line react-hooks/exhaustive-deps

  const [fieldErrors, setFieldErrors] = useState({
    email: null,
    password: null
  });
  const [touched, setTouched] = useState({
    email: false,
    password: false
  });

  const validateField = (field, value) => {
    switch (field) {
      case 'email':
        return validators.email(value);
      case 'password':
        return validators.loginPassword(value);
      default:
        return null;
    }
  };

  const handleBlur = (field, value) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setFieldErrors((prev) => ({
      ...prev,
      [field]: validateField(field, value)
    }));
  };

  const handleChange = (field, value, setter) => {
    setter(value);
    if (error) setError('');

    if (touched[field]) {
      setFieldErrors((prev) => ({
        ...prev,
        [field]: validateField(field, value)
      }));
    }
  };

  const validateAllFields = () => {
    const errors = {
      email: validators.email(email),
      password: validators.loginPassword(password)
    };
    setFieldErrors(errors);
    setTouched({ email: true, password: true });

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isOnline) {
      showToast.error("You're offline. Cannot sign in.");
      return;
    }

    const errors = validateAllFields();
    if (errors.email || errors.password) {
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

    try {
      const response = await loginUser(email, password);

      if (response.success !== false && response.user) {
        if (onLoginSuccess) {
          onLoginSuccess(response);
        }

        setEmail('');
        setPassword('');
        setFieldErrors({ email: null, password: null });
        setTouched({ email: false, password: false });
      } else {
        setError(response.message || 'Login failed');
        showToast.error(response.message || 'Login failed');
      }
    } catch (err) {
      const data = err?.response ? err.response.data : err;
      if (data && typeof data === 'object' && Array.isArray(data.errors)) {
        const backendErrors = {};
        data.errors.forEach((e) => {
          backendErrors[e.field] = e.message;
        });
        setFieldErrors((prev) => ({ ...prev, ...backendErrors }));
        showToast.error('Please check your credentials.');
      } else {
        const errorMsg = getApiErrorMessage(err, 'Invalid email or password');
        setError(errorMsg);
        showToast.error(errorMsg);
      }
    } finally {
      setLoading(false);
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
            onChange={(e) => handleChange('email', e.target.value, setEmail)}
            onBlur={(e) => handleBlur('email', e.target.value)}
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
              onChange={(e) =>
                handleChange('password', e.target.value, setPassword)
              }
              onBlur={(e) => handleBlur('password', e.target.value)}
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
