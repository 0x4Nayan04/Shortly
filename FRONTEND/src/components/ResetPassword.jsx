import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { resetPassword } from '../api/user.api';
import {
  formAlertClass,
  formSuccessIconWrapClass,
  getDesignInputClass
} from '../utils/designFormClasses';
import { validators } from '../utils/validation';
import { showToast, useOnlineStatus } from './UxEnhancements';
import PasswordVisibilityToggle from './PasswordVisibilityToggle';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({
    password: null,
    confirmPassword: null
  });
  const [touched, setTouched] = useState({
    password: false,
    confirmPassword: false
  });
  const [done, setDone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { isOnline } = useOnlineStatus();

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (field === 'password') {
      setFieldErrors((prev) => ({
        ...prev,
        password: validators.password(password)
      }));
    } else {
      const matchErr =
        password !== confirmPassword ? 'Passwords do not match' : null;
      setFieldErrors((prev) => ({
        ...prev,
        confirmPassword: !confirmPassword
          ? 'Please confirm your password'
          : matchErr
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isOnline) {
      showToast.error("You're offline. Cannot reset password.");
      return;
    }

    const passwordError = validators.password(password);
    const confirmError = !confirmPassword
      ? 'Please confirm your password'
      : password !== confirmPassword
        ? 'Passwords do not match'
        : null;

    setTouched({ password: true, confirmPassword: true });
    setFieldErrors({ password: passwordError, confirmPassword: confirmError });

    if (passwordError || confirmError) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      await resetPassword(token, password);
      setDone(true);
      showToast.success('Password reset successfully!');
    } catch (err) {
      const msg =
        err?.response?.data?.message || 'Invalid or expired reset link.';
      setError(msg);
      showToast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className='app-panel text-center'>
        <div className={formSuccessIconWrapClass}>
          <Check
            className='h-8 w-8 text-primary'
            aria-hidden='true'
          />
        </div>
        <h2 className='font-display text-xl font-medium tracking-display text-ink mb-2'>
          Password reset
        </h2>
        <p className='text-muted-strong mb-6'>
          Your password has been updated successfully.
        </p>
        <button
          type='button'
          onClick={() => navigate('/login')}
          className='sm-btn sm-btn-primary'>
          Sign in with new password
        </button>
      </div>
    );
  }

  return (
    <div className='app-panel'>
      <div className='mb-6 text-center'>
        <h2
          id='reset-heading'
          className='font-display text-xl font-medium tracking-display text-ink sm:text-2xl'>
          Set new password
        </h2>
        <p className='mt-2 text-muted-strong'>
          Choose a new password for your account.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className='space-y-4'
        aria-labelledby='reset-heading'>
        <div>
          <label
            htmlFor='reset-password'
            className='sm-label'>
            New password
          </label>
          <div className='relative'>
            <input
              id='reset-password'
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
                if (touched.password) {
                  setFieldErrors((prev) => ({
                    ...prev,
                    password: validators.password(e.target.value)
                  }));
                }
              }}
              onBlur={() => handleBlur('password')}
              placeholder='At least 6 characters'
              className={getDesignInputClass({
                hasError: touched.password && fieldErrors.password,
                className: 'pr-12'
              })}
              aria-invalid={
                touched.password && fieldErrors.password ? 'true' : 'false'
              }
              aria-describedby={
                fieldErrors.password ? 'reset-password-error' : undefined
              }
              autoComplete='new-password'
            />
            <PasswordVisibilityToggle
              visible={showPassword}
              onToggle={() => setShowPassword((v) => !v)}
            />
          </div>
          {touched.password && fieldErrors.password && (
            <p
              id='reset-password-error'
              className='sm-field-error'
              role='alert'>
              {fieldErrors.password}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor='reset-confirm-password'
            className='sm-label'>
            Confirm password
          </label>
          <div className='relative'>
            <input
              id='reset-confirm-password'
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError('');
                if (touched.confirmPassword) {
                  const matchErr =
                    e.target.value !== password
                      ? 'Passwords do not match'
                      : null;
                  setFieldErrors((prev) => ({
                    ...prev,
                    confirmPassword: !e.target.value
                      ? 'Please confirm your password'
                      : matchErr
                  }));
                }
              }}
              onBlur={() => handleBlur('confirmPassword')}
              placeholder='Re-enter your password'
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
                fieldErrors.confirmPassword ? 'reset-confirm-error' : undefined
              }
              autoComplete='new-password'
            />
            <PasswordVisibilityToggle
              visible={showConfirmPassword}
              onToggle={() => setShowConfirmPassword((v) => !v)}
            />
          </div>
          {touched.confirmPassword && fieldErrors.confirmPassword && (
            <p
              id='reset-confirm-error'
              className='sm-field-error'
              role='alert'>
              {fieldErrors.confirmPassword}
            </p>
          )}
        </div>

        <button
          type='submit'
          disabled={loading}
          aria-busy={loading}
          className='sm-btn sm-btn-primary sm-btn-block'>
          {loading ? (
            <>
              <Loader2
                className='h-5 w-5 animate-spin'
                aria-hidden='true'
              />
              Resetting...
            </>
          ) : (
            'Reset password'
          )}
        </button>
      </form>

      {error && (
        <div
          className={formAlertClass}
          role='alert'>
          {error}
        </div>
      )}

      <div className='mt-4 text-center'>
        <Link
          to='/forgot-password'
          className='landing-text-link text-sm'>
          Request a new reset link
        </Link>
      </div>
    </div>
  );
};

export default ResetPassword;
