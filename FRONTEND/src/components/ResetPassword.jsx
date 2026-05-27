import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { resetPassword } from '../api/user.api';
import { validators } from '../utils/validation';
import { showToast, useOnlineStatus } from './UxEnhancements';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ password: null, confirmPassword: null });
  const [touched, setTouched] = useState({ password: false, confirmPassword: false });
  const [done, setDone] = useState(false);
  const { isOnline } = useOnlineStatus();

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (field === 'password') {
      setFieldErrors((prev) => ({ ...prev, password: validators.password(password) }));
    } else {
      const matchErr = password !== confirmPassword ? 'Passwords do not match' : null;
      setFieldErrors((prev) => ({
        ...prev,
        confirmPassword: !confirmPassword ? 'Please confirm your password' : matchErr
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

  const getInputClass = (field) => {
    const baseClass = 'w-full px-4 py-3 border rounded-lg text-base focus:outline-none focus-visible:ring-2 transition-colors';
    const hasError = touched[field] && fieldErrors[field];
    if (hasError) {
      return `${baseClass} border-red-300 focus-visible:ring-red-500`;
    }
    return `${baseClass} border-gray-300 focus-visible:ring-blue-500`;
  };

  if (done) {
    return (
      <div className='max-w-md mx-auto mt-6 sm:mt-8 p-4 sm:p-6 bg-white rounded-lg shadow-md border border-gray-200 text-center'>
        <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
          <Check
            className='w-8 h-8 text-green-600'
            aria-hidden='true'
          />
        </div>
        <h2 className='text-xl font-bold text-gray-800 mb-2'>
          Password reset!
        </h2>
        <p className='text-gray-600 mb-6'>
          Your password has been updated successfully.
        </p>
        <button
          onClick={() => navigate('/login')}
          className='px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2'>
          Sign in with new password
        </button>
      </div>
    );
  }

  return (
    <div className='max-w-md mx-auto mt-6 sm:mt-8 p-4 sm:p-6 bg-white rounded-lg shadow-md border border-gray-200'>
      <div className='text-center mb-6'>
        <h2 className='text-xl sm:text-2xl font-bold text-gray-800'>
          Set new password
        </h2>
        <p className='text-gray-600 mt-2'>
          Choose a new password for your account.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className='space-y-4'>
        <div>
          <label
            htmlFor='reset-password'
            className='block text-sm font-medium text-gray-700 mb-1'>
            New Password
          </label>
          <input
            id='reset-password'
            type='password'
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
              if (touched.password) {
                setFieldErrors((prev) => ({ ...prev, password: validators.password(e.target.value) }));
              }
            }}
            onBlur={() => handleBlur('password')}
            placeholder='At least 6 characters'
            className={getInputClass('password')}
            aria-invalid={touched.password && fieldErrors.password ? 'true' : 'false'}
            aria-describedby={fieldErrors.password ? 'reset-password-error' : undefined}
            autoComplete='new-password'
          />
          {touched.password && fieldErrors.password && (
            <p id='reset-password-error' className='mt-1 text-sm text-red-600' role='alert'>
              {fieldErrors.password}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor='reset-confirm-password'
            className='block text-sm font-medium text-gray-700 mb-1'>
            Confirm Password
          </label>
          <input
            id='reset-confirm-password'
            type='password'
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setError('');
              if (touched.confirmPassword) {
                const matchErr = e.target.value !== password ? 'Passwords do not match' : null;
                setFieldErrors((prev) => ({ ...prev, confirmPassword: !e.target.value ? 'Please confirm your password' : matchErr }));
              }
            }}
            onBlur={() => handleBlur('confirmPassword')}
            placeholder='Re-enter your password'
            className={getInputClass('confirmPassword')}
            aria-invalid={touched.confirmPassword && fieldErrors.confirmPassword ? 'true' : 'false'}
            aria-describedby={fieldErrors.confirmPassword ? 'reset-confirm-error' : undefined}
            autoComplete='new-password'
          />
          {touched.confirmPassword && fieldErrors.confirmPassword && (
            <p id='reset-confirm-error' className='mt-1 text-sm text-red-600' role='alert'>
              {fieldErrors.confirmPassword}
            </p>
          )}
        </div>

        <button
          type='submit'
          disabled={loading}
          aria-busy={loading}
          className='w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-medium rounded-lg text-base transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 inline-flex items-center justify-center gap-2'>
          {loading ? (
            <>
              <div className='animate-spin'>
                <Loader2 className='h-5 w-5' aria-hidden='true' />
              </div>
              Resetting...
            </>
          ) : (
            'Reset password'
          )}
        </button>
      </form>

      {error && (
        <div
          className='mt-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm'
          role='alert'>
          {error}
        </div>
      )}

      <div className='mt-4 text-center'>
        <Link
          to='/forgot-password'
          className='text-sm text-blue-600 hover:text-blue-800 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded'>
          Request a new reset link
        </Link>
      </div>
    </div>
  );
};

export default ResetPassword;
