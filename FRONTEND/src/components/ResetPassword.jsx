import { useCallback, useReducer } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { resetPassword } from '../api/user.api';
import { getApiErrorMessage } from '../utils/axiosInstance';
import {
  validators,
  makeConfirmPasswordRevalidator
} from '../utils/validation';
import { useFormValidation } from '../hooks/useFormValidation';
import { useOnlineStatus } from './UxEnhancements';
import { showToast } from '../utils/showToast';
import PasswordField from './forms/PasswordField';
import FormAlert from './forms/FormAlert';
import SuccessPanel from './forms/SuccessPanel';

const initialState = {
  password: '',
  confirmPassword: '',
  loading: false,
  error: '',
  done: false,
  showPassword: false,
  showConfirmPassword: false
};

function resetReducer(state, action) {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value, error: '' };
    case 'SET_LOADING':
      return { ...state, loading: action.value };
    case 'SET_ERROR':
      return { ...state, error: action.value };
    case 'SET_DONE':
      return { ...state, done: action.value };
    case 'TOGGLE_PASSWORD':
      return { ...state, showPassword: !state.showPassword };
    case 'TOGGLE_CONFIRM_PASSWORD':
      return { ...state, showConfirmPassword: !state.showConfirmPassword };
    case 'RESET_START':
      return { ...state, loading: true, error: '' };
    case 'RESET_SUCCESS':
      return { ...state, loading: false, done: true };
    case 'RESET_FAILURE':
      return { ...state, loading: false, error: action.error };
    default:
      return state;
  }
}

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(resetReducer, initialState);
  const {
    password,
    confirmPassword,
    loading,
    error,
    done,
    showPassword,
    showConfirmPassword
  } = state;

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
      onAfterFieldChange: makeConfirmPasswordRevalidator()
    });

  const formValues = { password, confirmPassword };
  const onPasswordChange = (e) => {
    const value = e.target.value;
    dispatch({ type: 'SET_FIELD', field: 'password', value });
    onFieldChange(
      'password',
      { ...formValues, password: value },
      { clearError: () => dispatch({ type: 'SET_ERROR', value: '' }) }
    );
  };
  const onConfirmPasswordChange = (e) => {
    const value = e.target.value;
    dispatch({ type: 'SET_FIELD', field: 'confirmPassword', value });
    onFieldChange(
      'confirmPassword',
      { ...formValues, confirmPassword: value },
      { clearError: () => dispatch({ type: 'SET_ERROR', value: '' }) }
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

    dispatch({ type: 'RESET_START' });

    try {
      await resetPassword(token, password);
      dispatch({ type: 'RESET_SUCCESS' });
      showToast.success('Password reset successfully!');
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Invalid or expired reset link.');
      dispatch({ type: 'RESET_FAILURE', error: msg });
      showToast.error(msg);
    }
  };

  if (done) {
    return (
      <SuccessPanel
        icon={<Check className="size-8 text-primary" aria-hidden="true" />}
        heading="Password reset"
        message="Your password has been updated successfully."
        primaryAction={
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="sm-btn sm-btn-primary"
          >
            Sign in with new password
          </button>
        }
      />
    );
  }

  return (
    <div className="app-panel">
      <div className="mb-6 text-center">
        <h2
          id="reset-heading"
          className="font-display text-xl font-medium tracking-display text-ink sm:text-2xl"
        >
          Set new password
        </h2>
        <p className="mt-2 text-muted-strong">
          Choose a new password for your account.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4"
        aria-labelledby="reset-heading"
      >
        <PasswordField
          id="reset-password"
          label="New password"
          value={password}
          onChange={onPasswordChange}
          onBlur={() => handleBlur('password', formValues)}
          error={fieldErrors.password}
          touched={touched.password}
          placeholder="At least 12 characters"
          autoComplete="new-password"
          showPassword={showPassword}
          onToggleVisibility={() => dispatch({ type: 'TOGGLE_PASSWORD' })}
        />

        <PasswordField
          id="reset-confirm-password"
          label="Confirm password"
          value={confirmPassword}
          onChange={onConfirmPasswordChange}
          onBlur={() => handleBlur('confirmPassword', formValues)}
          error={fieldErrors.confirmPassword}
          touched={touched.confirmPassword}
          placeholder="Re-enter your password"
          autoComplete="new-password"
          showPassword={showConfirmPassword}
          onToggleVisibility={() =>
            dispatch({ type: 'TOGGLE_CONFIRM_PASSWORD' })
          }
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
              Resetting&hellip;
            </>
          ) : (
            'Reset password'
          )}
        </button>
      </form>

      <FormAlert error={error} />

      <div className="mt-4 text-center">
        <Link to="/forgot-password" className="landing-text-link text-sm">
          Request a new reset link
        </Link>
      </div>
    </div>
  );
};

export default ResetPassword;
