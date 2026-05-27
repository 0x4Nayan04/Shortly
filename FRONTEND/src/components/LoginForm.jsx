import { useEffect, useRef, useState } from 'react';
import { useBlocker } from 'react-router-dom';
import { loginUser } from '../api/user.api';
import { validators } from '../utils/validation';
import PasswordVisibilityToggle from './PasswordVisibilityToggle';
import { showToast, useOnlineStatus, useUnsavedChanges, useConfirmDialog, ConfirmDialog } from './UxEnhancements';

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

  // Field-level validation errors (shown on blur or submit)
  const [fieldErrors, setFieldErrors] = useState({
    email: null,
    password: null
  });
  // Track which fields have been touched (blurred)
  const [touched, setTouched] = useState({
    email: false,
    password: false
  });

  // Validate a single field
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

  // Handle field blur - validate and mark as touched
  const handleBlur = (field, value) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setFieldErrors((prev) => ({
      ...prev,
      [field]: validateField(field, value)
    }));
  };

  // Handle field change - clear error if field is touched and now valid
  const handleChange = (field, value, setter) => {
    setter(value);
    // Clear server error when user starts typing
    if (error) setError('');

    // If field was touched, validate on change for immediate feedback
    if (touched[field]) {
      setFieldErrors((prev) => ({
        ...prev,
        [field]: validateField(field, value)
      }));
    }
  };

  // Validate all fields before submit
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

    // Check online status
    if (!isOnline) {
      showToast.error("You're offline. Cannot sign in.");
      return;
    }

    // Validate all fields
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

      if (response.success) {
        // Call the success callback if provided
        if (onLoginSuccess) {
          onLoginSuccess(response);
        }

        // Clear form
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
        const errorMsg =
          typeof data === 'string'
            ? data
            : data?.message || 'Invalid email or password';
        setError(errorMsg);
        showToast.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper to get input class based on validation state
  const getInputClass = (field) => {
    const baseClass =
      'w-full px-4 py-3 border rounded-lg text-base focus:outline-none focus-visible:ring-2 transition-colors';
    const hasError = touched[field] && fieldErrors[field];

    if (hasError) {
      return `${baseClass} border-red-300 focus-visible:ring-red-500 focus:border-red-500`;
    }
    return `${baseClass} border-gray-300 focus-visible:ring-blue-500 focus:border-blue-500`;
  };

  return (
    <div className='max-w-md mx-auto mt-6 sm:mt-8 p-4 sm:p-6 bg-white rounded-lg shadow-md border border-gray-200'>
      <div className='text-center mb-6'>
        <h2
          id='login-heading'
          className='text-xl sm:text-2xl font-bold text-gray-800'>
          Welcome Back
        </h2>
        <p className='text-gray-600 mt-2'>Sign in to your account</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className='space-y-4'
        aria-labelledby='login-heading'>
        <div>
          <label
            htmlFor='login-email'
            className='block text-sm font-medium text-gray-700 mb-1'>
            Email Address
          </label>
          <input
            ref={emailRef}
            id='login-email'
            type='email'
            value={email}
            onChange={(e) => handleChange('email', e.target.value, setEmail)}
            onBlur={(e) => handleBlur('email', e.target.value)}
            placeholder='Enter your email'
            className={getInputClass('email')}
            aria-invalid={touched.email && fieldErrors.email ? 'true' : 'false'}
            aria-describedby={
              fieldErrors.email ? 'login-email-error' : undefined
            }
            autoComplete='email'
          />
          {touched.email && fieldErrors.email && (
            <p
              id='login-email-error'
              className='mt-1 text-sm text-red-600'
              role='alert'>
              {fieldErrors.email}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor='login-password'
            className='block text-sm font-medium text-gray-700 mb-1'>
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
              className={`${getInputClass('password')} pr-12`}
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
              className='mt-1 text-sm text-red-600'
              role='alert'>
              {fieldErrors.password}
            </p>
          )}
        </div>

        <div className='flex justify-end'>
          <button
            type='button'
            onClick={switchToForgotPassword}
            className='text-sm text-blue-600 hover:text-blue-800 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded'>
            Forgot password?
          </button>
        </div>

        <button
          type='submit'
          disabled={loading}
          aria-busy={loading}
          className='w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-medium rounded-lg text-base transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 inline-flex items-center justify-center gap-2'>
          {loading ? (
            <>
              <div className='animate-spin'>
                <svg
                  className='h-5 w-5'
                  fill='none'
                  viewBox='0 0 24 24'
                  aria-hidden='true'>
                  <circle
                    className='opacity-25'
                    cx='12'
                    cy='12'
                    r='10'
                    stroke='currentColor'
                    strokeWidth='4'
                  />
                  <path
                    className='opacity-75'
                    fill='currentColor'
                    d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z'
                  />
                </svg>
              </div>
              Signing In...
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      {error && (
        <div
          className='mt-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm'
          role='alert'
          aria-live='assertive'>
          {error}
        </div>
      )}

      <ConfirmDialog {...unsavedDialog} />

      <div className='mt-6 text-center'>
        <p className='text-sm text-gray-600'>
          Don't have an account?{' '}
          <button
            onClick={switchToRegister}
            className='text-blue-600 hover:text-blue-800 font-medium hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded'>
            Sign up here
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
