import { useState } from 'react';
import { Mail } from 'lucide-react';
import { forgotPassword } from '../api/user.api';
import { validators } from '../utils/validation';
import { showToast } from './UxEnhancements';

const ForgotPassword = ({ switchToLogin }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);

  const validateField = (value) => validators.email(value);

  const handleBlur = () => {
    setTouched(true);
    const fieldError = validateField(email);
    setError(fieldError || '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    const fieldError = validateField(email);
    if (fieldError) {
      setError(fieldError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      await forgotPassword(email);
      setSent(true);
      showToast.success('Reset link sent if account exists.');
    } catch (err) {
      const msg =
        err?.response?.data?.message || 'Something went wrong. Try again.';
      setError(msg);
      showToast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className='max-w-md mx-auto mt-6 sm:mt-8 p-4 sm:p-6 bg-white rounded-lg shadow-md border border-gray-200 text-center'>
        <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
          <Mail
            className='w-8 h-8 text-green-600'
            aria-hidden='true'
          />
        </div>
        <h2 className='text-xl font-bold text-gray-800 mb-2'>
          Check your email
        </h2>
        <p className='text-gray-600 mb-6'>
          If an account exists for <strong>{email}</strong>, you&apos;ll receive
          a password reset link shortly.
        </p>
        <button
          onClick={switchToLogin}
          className='text-blue-600 hover:text-blue-800 font-medium hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded'>
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <div className='max-w-md mx-auto mt-6 sm:mt-8 p-4 sm:p-6 bg-white rounded-lg shadow-md border border-gray-200'>
      <div className='text-center mb-6'>
        <h2 className='text-xl sm:text-2xl font-bold text-gray-800'>
          Reset your password
        </h2>
        <p className='text-gray-600 mt-2'>
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className='space-y-4'>
        <div>
          <label
            htmlFor='forgot-email'
            className='block text-sm font-medium text-gray-700 mb-1'>
            Email Address
          </label>
          <input
            id='forgot-email'
            type='email'
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (touched) setError(validateField(e.target.value) || '');
            }}
            onBlur={handleBlur}
            placeholder='Enter your email'
            className={`w-full px-4 py-3 border rounded-lg text-base focus:outline-none focus-visible:ring-2 transition-colors ${
              touched && error
                ? 'border-red-300 focus-visible:ring-red-500'
                : 'border-gray-300 focus-visible:ring-blue-500'
            }`}
            aria-invalid={touched && !!error}
            aria-describedby={error ? 'forgot-email-error' : undefined}
            autoComplete='email'
          />
          {touched && error && (
            <p
              id='forgot-email-error'
              className='mt-1 text-sm text-red-600'
              role='alert'>
              {error}
            </p>
          )}
        </div>

        <button
          type='submit'
          disabled={loading}
          aria-busy={loading}
          className='w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-medium rounded-lg text-base transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2'>
          {loading ? 'Sending...' : 'Send reset link'}
        </button>
      </form>

      {error && (
        <div
          className='mt-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm'
          role='alert'>
          {error}
        </div>
      )}

      <div className='mt-6 text-center'>
        <p className='text-sm text-gray-600'>
          Remember your password?{' '}
          <button
            onClick={switchToLogin}
            className='text-blue-600 hover:text-blue-800 font-medium hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded'>
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
