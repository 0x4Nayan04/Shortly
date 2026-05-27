import { useState, useEffect } from 'react';
import { useBlocker } from 'react-router-dom';
import { registerUser } from '../api/user.api';
import { validators } from '../utils/validation';
import PasswordVisibilityToggle from './PasswordVisibilityToggle';
import {
  showToast,
  useOnlineStatus,
  useUnsavedChanges,
  useConfirmDialog,
  ConfirmDialog
} from './UxEnhancements';

const RegisterForm = ({ onRegisterSuccess, switchToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { isOnline } = useOnlineStatus();

  const hasUnsavedChanges =
    !loading && (name || email || password || confirmPassword);
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

  // Field-level validation errors
  const [fieldErrors, setFieldErrors] = useState({
    name: null,
    email: null,
    password: null,
    confirmPassword: null
  });
  // Track which fields have been touched
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false
  });

  // Validate a single field
  const validateField = (field, value) => {
    switch (field) {
      case 'name':
        return validators.name(value);
      case 'email':
        return validators.email(value);
      case 'password':
        return validators.password(value);
      case 'confirmPassword':
        return validators.confirmPassword(value, password);
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

  // Handle field change
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

    // Special case: if password changes and confirmPassword is touched, revalidate confirmPassword
    if (field === 'password' && touched.confirmPassword) {
      setFieldErrors((prev) => ({
        ...prev,
        confirmPassword: validators.confirmPassword(confirmPassword, value)
      }));
    }
  };

  // Validate all fields before submit
  const validateAllFields = () => {
    const errors = {
      name: validators.name(name),
      email: validators.email(email),
      password: validators.password(password),
      confirmPassword: validators.confirmPassword(confirmPassword, password)
    };
    setFieldErrors(errors);
    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true
    });

    return (
      !errors.name &&
      !errors.email &&
      !errors.password &&
      !errors.confirmPassword
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check online status
    if (!isOnline) {
      showToast.error("You're offline. Cannot create account.");
      return;
    }

    // Validate all fields
    if (!validateAllFields()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await registerUser(name, email, password);

      if (response.success) {
        showToast.success('Account created successfully!');
        // Call the success callback if provided
        if (onRegisterSuccess) {
          onRegisterSuccess(response);
        }

        // Clear form
        setName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setFieldErrors({
          name: null,
          email: null,
          password: null,
          confirmPassword: null
        });
        setTouched({
          name: false,
          email: false,
          password: false,
          confirmPassword: false
        });
      } else {
        setError(response.message || 'Registration failed');
        showToast.error(response.message || 'Registration failed');
      }
    } catch (err) {
      const data = err?.response ? err.response.data : err;
      if (data && typeof data === 'object' && Array.isArray(data.errors)) {
        const backendErrors = {};
        data.errors.forEach((e) => {
          backendErrors[e.field] = e.message;
        });
        setFieldErrors((prev) => ({ ...prev, ...backendErrors }));
        showToast.error('Please check the form for errors.');
      } else {
        const errorMsg =
          typeof data === 'string'
            ? data
            : data?.message || 'Registration failed';
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
        <h2 className='text-xl sm:text-2xl font-bold text-gray-800'>
          Create Account
        </h2>
        <p className='text-gray-600 mt-2'>Sign up to get started</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className='space-y-4'>
        <div>
          <label
            htmlFor='name'
            className='block text-sm font-medium text-gray-700 mb-1'>
            Full Name
          </label>
          <input
            id='name'
            type='text'
            value={name}
            onChange={(e) => handleChange('name', e.target.value, setName)}
            onBlur={(e) => handleBlur('name', e.target.value)}
            placeholder='Enter your full name'
            className={getInputClass('name')}
            aria-invalid={touched.name && fieldErrors.name ? 'true' : 'false'}
            aria-describedby={fieldErrors.name ? 'name-error' : undefined}
          />
          {touched.name && fieldErrors.name && (
            <p
              id='name-error'
              className='mt-1 text-sm text-red-600'
              role='alert'>
              {fieldErrors.name}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor='email'
            className='block text-sm font-medium text-gray-700 mb-1'>
            Email Address
          </label>
          <input
            id='email'
            type='email'
            value={email}
            onChange={(e) => handleChange('email', e.target.value, setEmail)}
            onBlur={(e) => handleBlur('email', e.target.value)}
            placeholder='Enter your email'
            className={getInputClass('email')}
            aria-invalid={touched.email && fieldErrors.email ? 'true' : 'false'}
            aria-describedby={fieldErrors.email ? 'email-error' : undefined}
          />
          {touched.email && fieldErrors.email && (
            <p
              id='email-error'
              className='mt-1 text-sm text-red-600'
              role='alert'>
              {fieldErrors.email}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor='password'
            className='block text-sm font-medium text-gray-700 mb-1'>
            Password
          </label>
          <div className='relative'>
            <input
              id='password'
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
                fieldErrors.password ? 'password-error' : undefined
              }
            />
            <PasswordVisibilityToggle
              visible={showPassword}
              onToggle={() => setShowPassword(!showPassword)}
            />
          </div>
          {password.length > 0 && password.length < 6 && (
            <p
              className={`mt-1 text-sm ${touched.password && fieldErrors.password ? 'text-red-600' : 'text-gray-500'}`}
              role={
                touched.password && fieldErrors.password ? 'alert' : undefined
              }>
              {touched.password && fieldErrors.password
                ? fieldErrors.password
                : 'Password must be at least 6 characters'}
            </p>
          )}
          {password.length >= 6 && (
            <div className='mt-2'>
              <div className='flex gap-1'>
                {[
                  password.length >= 8,
                  /[A-Z]/.test(password),
                  /[a-z]/.test(password),
                  /[0-9]/.test(password),
                  /[^A-Za-z0-9]/.test(password)
                ].map((met, i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      met ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
              <p className='text-xs text-gray-500 mt-1'>
                {password.length >= 8 &&
                /[A-Z]/.test(password) &&
                /[0-9]/.test(password) &&
                /[^A-Za-z0-9]/.test(password)
                  ? 'Strong password'
                  : password.length >= 8 && /[A-Z]/.test(password)
                    ? 'Medium password'
                    : 'Add uppercase, number, and special char for a stronger password'}
              </p>
            </div>
          )}
        </div>

        <div>
          <label
            htmlFor='confirmPassword'
            className='block text-sm font-medium text-gray-700 mb-1'>
            Confirm Password
          </label>
          <div className='relative'>
            <input
              id='confirmPassword'
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) =>
                handleChange(
                  'confirmPassword',
                  e.target.value,
                  setConfirmPassword
                )
              }
              onBlur={(e) => handleBlur('confirmPassword', e.target.value)}
              placeholder='Confirm your password'
              className={`${getInputClass('confirmPassword')} pr-12`}
              aria-invalid={
                touched.confirmPassword && fieldErrors.confirmPassword
                  ? 'true'
                  : 'false'
              }
              aria-describedby={
                fieldErrors.confirmPassword
                  ? 'confirmPassword-error'
                  : undefined
              }
            />
            <PasswordVisibilityToggle
              visible={showConfirmPassword}
              onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
            />
          </div>
          {touched.confirmPassword && fieldErrors.confirmPassword && (
            <p
              id='confirmPassword-error'
              className='mt-1 text-sm text-red-600'
              role='alert'>
              {fieldErrors.confirmPassword}
            </p>
          )}
        </div>

        <button
          type='submit'
          disabled={loading}
          aria-busy={loading}
          className='w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-medium rounded-lg text-base transition-colors inline-flex items-center justify-center gap-2'>
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
              Creating Account...
            </>
          ) : (
            'Create Account'
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
          Already have an account?{' '}
          <button
            type='button'
            onClick={switchToLogin}
            className='text-blue-600 hover:text-blue-800 font-medium hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded'>
            Sign in here
          </button>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm;
