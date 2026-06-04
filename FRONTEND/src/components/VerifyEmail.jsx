import { useEffect, useState } from 'react';
import { Check, Loader2, MailX } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { verifyEmail } from '../api/user.api';
import { getApiErrorMessage } from '../utils/axiosInstance';
import { formSuccessIconWrapClass } from '../utils/designFormClasses';
import { showToast } from '../utils/showToast';
import FormAlert from './forms/FormAlert';
import SuccessPanel from './forms/SuccessPanel';

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('Verification link is invalid.');
      return;
    }

    let cancelled = false;

    const runVerification = async () => {
      try {
        await verifyEmail(token);
        if (!cancelled) {
          setStatus('success');
          showToast.success('Email verified successfully!');
        }
      } catch (err) {
        if (!cancelled) {
          setStatus('error');
          setError(
            getApiErrorMessage(err, 'Invalid or expired verification link.')
          );
        }
      }
    };

    runVerification();

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (status === 'loading') {
    return (
      <div className="app-panel text-center">
        <div className={formSuccessIconWrapClass}>
          <Loader2
            className="size-8 animate-spin text-primary"
            aria-hidden="true"
          />
        </div>
        <h2 className="font-display text-xl font-medium tracking-display text-ink mb-2">
          Verifying your email
        </h2>
        <p className="text-muted-strong">
          Please wait while we confirm your address.
        </p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <SuccessPanel
        icon={<Check className="size-8 text-primary" aria-hidden="true" />}
        heading="Email verified"
        message="Your account is ready. Sign in to start shortening links."
        primaryAction={
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="sm-btn sm-btn-primary"
          >
            Sign in
          </button>
        }
      />
    );
  }

  return (
    <div className="app-panel text-center">
      <div className="settings-danger__icon-wrap mx-auto mb-4">
        <MailX className="h-8 w-8 text-[#dc2626]" aria-hidden="true" />
      </div>
      <h2 className="font-display text-xl font-medium tracking-display text-ink mb-2">
        Verification failed
      </h2>
      <p className="text-muted-strong mb-4">
        We couldn&apos;t verify your email address.
      </p>
      <FormAlert error={error} className="mb-6 text-left" />
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link to="/register" className="sm-btn sm-btn-secondary">
          Create account
        </Link>
        <Link to="/login" className="sm-btn sm-btn-primary">
          Sign in
        </Link>
      </div>
    </div>
  );
};

export default VerifyEmail;
