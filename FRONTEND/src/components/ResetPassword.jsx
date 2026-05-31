import { useCallback, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { resetPassword } from '../api/user.api';
import { getApiErrorMessage } from '../utils/axiosInstance';
import {
  formAlertClass,
  formSuccessIconWrapClass,
  getDesignInputClass
} from '../utils/designFormClasses';
import { validators } from '../utils/validation';
import { useFormValidation } from '../hooks/useFormValidation';
import { showToast, useOnlineStatus } from './UxEnhancements';
import PasswordVisibilityToggle from './PasswordVisibilityToggle';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { isOnline } = useOnlineStatus();

  const getRules = useCallback(
    (values) => ({
      password: validators.password,
      confirmPassword: [validators.confirmPassword, values.password]
    }),
    []
  );

  const { fieldErrors, touched, handleBlur, onFieldChange, validateAll } =
    useFormValidation(['password', 'confirmPassword'], getRules, {
      onAfterFieldChange: (field, values, { setFieldErrors, getTouched }) => {
        if (field === 'password' && getTouched().confirmPassword) {
          setFieldErrors((prev) => ({
            ...prev,
            confirmPassword: validators.confirmPassword(
              values.confirmPassword,
              values.password
            )
          }));
        }
      }
    });

  const formValues = { password, confirmPassword };

  const updateField = (field, value, setter) => {
    setter(value);
    onFieldChange(
      field,
      { ...formValues, [field]: value },
      {
        clearError: () => setError('')
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isOnline) {
      showToast.error("You're offline. Cannot reset password.");
      return;
    }

    if (!validateAll(formValues).valid) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      await resetPassword(token, password);
      setDone(true);
      showToast.success('Password reset successfully!');
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Invalid or expired reset link.');
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
            className='size-8 text-primary'
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
              onChange={(e) =>
                updateField('password', e.target.value, setPassword)
              }
              onBlur={() => handleBlur('password', formValues)}
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
              onChange={(e) =>
                updateField(
                  'confirmPassword',
                  e.target.value,
                  setConfirmPassword
                )
              }
              onBlur={() => handleBlur('confirmPassword', formValues)}
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
                className='size-5 animate-spin'
                aria-hidden='true'
              />
              Resetting&hellip;
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
