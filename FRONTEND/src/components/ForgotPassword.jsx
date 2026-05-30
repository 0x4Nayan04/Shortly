import { useState } from 'react';
import { Loader2, Mail } from 'lucide-react';
import { forgotPassword } from '../api/user.api';
import { getApiErrorMessage } from '../utils/axiosInstance';
import {
  formSuccessIconWrapClass,
  getDesignInputClass
} from '../utils/designFormClasses';
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
      const msg = getApiErrorMessage(err, 'Something went wrong. Try again.');
      setError(msg);
      showToast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
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
          If an account exists for <strong className='text-ink'>{email}</strong>
          , you&apos;ll receive a password reset link shortly.
        </p>
        <button
          type='button'
          onClick={switchToLogin}
          className='landing-text-link font-medium'>
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <div className='app-panel'>
      <div className='mb-6 text-center'>
        <h2
          id='forgot-heading'
          className='font-display text-xl font-medium tracking-display text-ink sm:text-2xl'>
          Reset your password
        </h2>
        <p className='mt-2 text-muted-strong'>
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className='space-y-4'
        aria-labelledby='forgot-heading'>
        <div>
          <label
            htmlFor='forgot-email'
            className='sm-label'>
            Email address
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
            className={getDesignInputClass({
              hasError: touched && !!error
            })}
            aria-invalid={touched && !!error}
            aria-describedby={error ? 'forgot-email-error' : undefined}
            autoComplete='email'
          />
          {touched && error && (
            <p
              id='forgot-email-error'
              className='sm-field-error'
              role='alert'>
              {error}
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
              Sending...
            </>
          ) : (
            'Send reset link'
          )}
        </button>
      </form>

      <div className='mt-6 text-center'>
        <p className='text-sm text-muted-strong'>
          Remember your password?{' '}
          <button
            type='button'
            onClick={switchToLogin}
            className='landing-text-link font-medium'>
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
