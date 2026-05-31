import { useState, useEffect } from 'react';
import { Mail } from 'lucide-react';
import AuthSubmitButton from './AuthSubmitButton';
import { useBlocker } from 'react-router-dom';
import { registerUser } from '../api/user.api';
import { getApiErrorMessage } from '../utils/axiosInstance';
import {
  formAlertClass,
  formSuccessIconWrapClass,
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

const RegisterForm = ({ onRegisterSuccess, switchToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationPending, setVerificationPending] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
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

  const [fieldErrors, setFieldErrors] = useState({
    name: null,
    email: null,
    password: null,
    confirmPassword: null
  });
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false
  });

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

    if (field === 'password' && touched.confirmPassword) {
      setFieldErrors((prev) => ({
        ...prev,
        confirmPassword: validators.confirmPassword(confirmPassword, value)
      }));
    }
  };

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

    if (!isOnline) {
      showToast.error("You're offline. Cannot create account.");
      return;
    }

    if (!validateAllFields()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await registerUser(name, email, password);

      if (response.success !== false && response.user) {
        const needsVerification = response.user.isEmailVerified === false;

        if (needsVerification) {
          setRegisteredEmail(email);
          setVerificationPending(true);
          showToast.success(
            response.message ||
              'Account created. Please verify your email before signing in.'
          );
          return;
        }

        showToast.success(response.message || 'Account created successfully!');
        if (onRegisterSuccess) {
          onRegisterSuccess(response);
        }

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
        const errorMsg = getApiErrorMessage(err, 'Registration failed');
        setError(errorMsg);
        showToast.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  if (verificationPending) {
    return (
      <div className='app-panel text-center'>
        <div className={formSuccessIconWrapClass}>
          <Mail
            className='h-8 w-8 text-primary'
            aria-hidden='true'
          />
        </div>
        <h2 className='font-display text-xl font-medium tracking-display text-ink mb-2'>
          Check your email
        </h2>
        <p className='text-muted-strong mb-6'>
          We sent a verification link to{' '}
          <strong className='text-ink'>{registeredEmail}</strong>. Open it to
          activate your account, then sign in.
        </p>
        <button
          type='button'
          onClick={switchToLogin}
          className='sm-btn sm-btn-primary'>
          Go to sign in
        </button>
      </div>
    );
  }

  return (
    <div className='app-panel'>
      <div className='mb-6 text-center'>
        <h2
          id='register-heading'
          className='font-display text-xl font-medium tracking-display text-ink sm:text-2xl'>
          Create account
        </h2>
        <p className='mt-2 text-muted-strong'>Sign up to get started</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className='space-y-4'
        aria-labelledby='register-heading'>
        <div>
          <label
            htmlFor='name'
            className='sm-label'>
            Full name
          </label>
          <input
            id='name'
            type='text'
            value={name}
            onChange={(e) => handleChange('name', e.target.value, setName)}
            onBlur={(e) => handleBlur('name', e.target.value)}
            placeholder='Enter your full name'
            className={getDesignInputClass({
              hasError: touched.name && fieldErrors.name
            })}
            aria-invalid={touched.name && fieldErrors.name ? 'true' : 'false'}
            aria-describedby={fieldErrors.name ? 'name-error' : undefined}
          />
          {touched.name && fieldErrors.name && (
            <p
              id='name-error'
              className='sm-field-error'
              role='alert'>
              {fieldErrors.name}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor='email'
            className='sm-label'>
            Email address
          </label>
          <input
            id='email'
            type='email'
            value={email}
            onChange={(e) => handleChange('email', e.target.value, setEmail)}
            onBlur={(e) => handleBlur('email', e.target.value)}
            placeholder='Enter your email'
            className={getDesignInputClass({
              hasError: touched.email && fieldErrors.email
            })}
            aria-invalid={touched.email && fieldErrors.email ? 'true' : 'false'}
            aria-describedby={fieldErrors.email ? 'email-error' : undefined}
          />
          {touched.email && fieldErrors.email && (
            <p
              id='email-error'
              className='sm-field-error'
              role='alert'>
              {fieldErrors.email}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor='password'
            className='sm-label'>
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
              className={getDesignInputClass({
                hasError: touched.password && fieldErrors.password,
                className: 'pr-12'
              })}
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
              className={`mt-1 text-sm ${touched.password && fieldErrors.password ? 'sm-field-error !mt-1' : 'text-muted'}`}
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
                    className={`h-1.5 flex-1 transition-colors ${
                      met ? 'bg-primary' : 'bg-border'
                    }`}
                  />
                ))}
              </div>
              <p className='mt-1 text-xs text-muted'>
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
            className='sm-label'>
            Confirm password
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
              className={getDesignInputClass({
                hasError:
                  touched.confirmPassword && fieldErrors.confirmPassword,
                className: 'pr-12'
              })}
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
              className='sm-field-error'
              role='alert'>
              {fieldErrors.confirmPassword}
            </p>
          )}
        </div>

        <AuthSubmitButton
          loading={loading}
          loadingLabel='Creating account…'>
          Create account
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
          Already have an account?{' '}
          <button
            type='button'
            onClick={switchToLogin}
            className='landing-text-link font-medium'>
            Sign in here
          </button>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm;
