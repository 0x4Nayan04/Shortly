import { useCallback, useState } from 'react';
import { Loader2, Mail } from 'lucide-react';
import { forgotPassword } from '../api/user.api';
import { getApiErrorMessage } from '../utils/axiosInstance';
import { validators } from '../utils/validation';
import { useFormValidation } from '../hooks/useFormValidation';
import { showToast } from '../utils/showToast';
import FormField from './forms/FormField';
import SuccessPanel from './forms/SuccessPanel';

const ForgotPassword = ({ switchToLogin }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const getRules = useCallback(() => ({ email: validators.email }), []);

  const { fieldErrors, touched, handleBlur, onFieldChange, validateAll } =
    useFormValidation(['email'], getRules);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const values = { email };

    if (!validateAll(values).valid) {
      return;
    }

    setLoading(true);
    setSubmitError('');

    try {
      await forgotPassword(email);
      setSent(true);
      showToast.success('Reset link sent if account exists.');
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Something went wrong. Try again.');
      setSubmitError(msg);
      showToast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <SuccessPanel
        icon={<Mail className="size-8 text-primary" aria-hidden="true" />}
        heading="Check your email"
        message={
          <>
            If an account exists for{' '}
            <strong className="text-ink">{email}</strong>, you&apos;ll receive a
            password reset link shortly.
          </>
        }
        primaryAction={
          <button
            type="button"
            onClick={switchToLogin}
            className="landing-text-link font-medium"
          >
            Back to sign in
          </button>
        }
      />
    );
  }

  return (
    <div className="app-panel">
      <div className="mb-6 text-center">
        <h2
          id="forgot-heading"
          className="font-display text-xl font-medium tracking-display text-ink sm:text-2xl"
        >
          Reset your password
        </h2>
        <p className="mt-2 text-muted-strong">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4"
        aria-labelledby="forgot-heading"
      >
        <FormField
          id="forgot-email"
          label="Email address"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            onFieldChange(
              'email',
              { email: e.target.value },
              {
                clearError: () => setSubmitError('')
              }
            );
          }}
          onBlur={() => handleBlur('email', { email })}
          error={fieldErrors.email}
          touched={touched.email}
          placeholder="Enter your email"
          autoComplete="email"
        />

        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="sm-btn sm-btn-primary sm-btn-block"
        >
          {loading ? (
            <>
              <Loader2 className="size-5 animate-spin" aria-hidden="true" />
              Sending&hellip;
            </>
          ) : (
            'Send reset link'
          )}
        </button>
      </form>

      {submitError && (
        <p className="sm-field-error mt-4 text-center" role="alert">
          {submitError}
        </p>
      )}

      <div className="mt-6 text-center">
        <p className="text-sm text-muted-strong">
          Remember your password?{' '}
          <button
            type="button"
            onClick={switchToLogin}
            className="landing-text-link font-medium"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
