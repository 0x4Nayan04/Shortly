import { useCallback, useReducer } from 'react';
import { Mail } from 'lucide-react';
import { registerUser, resendVerificationEmail } from '../api/user.api';
import { getApiErrorMessage } from '../utils/axiosInstance';
import {
  validators,
  makeConfirmPasswordRevalidator
} from '../utils/validation';
import { handleApiFormError } from '../utils/apiErrors';
import { useFormValidation } from '../hooks/useFormValidation';
import { useUnsavedNavigationGuard } from '../hooks/useUnsavedNavigationGuard';
import { useOnlineStatus } from './UxEnhancements';
import { ConfirmDialog } from './ux/confirmDialog';
import { showToast } from '../utils/showToast';
import FormAlert from './forms/FormAlert';
import SuccessPanel from './forms/SuccessPanel';
import VerificationActions from './auth/VerificationActions';
import RegisterFormFields from './auth/RegisterFormFields';
import {
  registerInitialState,
  registerReducer
} from './auth/registerFormState';

const RegisterForm = ({ onRegisterSuccess, switchToLogin }) => {
  const [state, dispatch] = useReducer(registerReducer, registerInitialState);
  const {
    name,
    email,
    password,
    confirmPassword,
    loading,
    error,
    verificationPending,
    registeredEmail,
    resendingVerification,
    showPassword,
    showConfirmPassword
  } = state;

  const { isOnline } = useOnlineStatus();

  const getRules = useCallback(
    (values) => ({
      name: validators.name,
      email: validators.email,
      password: validators.password,
      confirmPassword: [validators.confirmPassword, values.password]
    }),
    []
  );

  const {
    fieldErrors,
    touched,
    handleBlur,
    onFieldChange,
    validateAll,
    mergeFieldErrors,
    resetValidation
  } = useFormValidation(
    ['name', 'email', 'password', 'confirmPassword'],
    getRules,
    {
      onAfterFieldChange: makeConfirmPasswordRevalidator()
    }
  );

  const hasUnsavedChanges =
    !loading && (name || email || password || confirmPassword);
  const unsavedDialog = useUnsavedNavigationGuard(hasUnsavedChanges);

  const formValues = { name, email, password, confirmPassword };
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

  const handleRegisterSuccess = (response) => {
    if (response.user?.isEmailVerified === false) {
      dispatch({ type: 'SET_VERIFICATION_PENDING', value: true, email });
      showToast.success(
        response.message ||
          'Account created. Please verify your email before signing in.'
      );
      return;
    }
    showToast.success(response.message || 'Account created successfully!');
    if (onRegisterSuccess) onRegisterSuccess(response);
    dispatch({ type: 'REGISTER_SUCCESS' });
    resetValidation();
  };

  const handleRegisterFailure = (response) => {
    const message = response.message || 'Registration failed';
    dispatch({ type: 'SET_ERROR', value: message });
    showToast.error(message);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isOnline) {
      showToast.error("You're offline. Cannot create account.");
      return;
    }
    if (!validateAll(formValues).valid) return;

    dispatch({ type: 'REGISTER_START' });

    try {
      const response = await registerUser(name, email, password);
      if (response.success !== false && response.user) {
        handleRegisterSuccess(response);
      } else {
        handleRegisterFailure(response);
      }
    } catch (err) {
      handleApiFormError(
        err,
        {
          setError: (val) => dispatch({ type: 'SET_ERROR', value: val }),
          mergeFieldErrors
        },
        { fallbackMessage: 'Registration failed' }
      );
    } finally {
      dispatch({ type: 'SET_LOADING', value: false });
    }
  };

  const handleResendVerification = async () => {
    if (!registeredEmail) return;
    if (!isOnline) {
      showToast.error("You're offline. Cannot resend verification email.");
      return;
    }
    dispatch({ type: 'SET_RESENDING_VERIFICATION', value: true });
    try {
      const response = await resendVerificationEmail(registeredEmail);
      showToast.success(
        response.message ||
          'If your account needs verification, a new link has been sent.'
      );
    } catch (err) {
      showToast.error(
        getApiErrorMessage(err, 'Failed to resend verification email.')
      );
    } finally {
      dispatch({ type: 'SET_RESENDING_VERIFICATION', value: false });
    }
  };

  if (verificationPending) {
    return (
      <SuccessPanel
        icon={<Mail className="size-8 text-primary" aria-hidden="true" />}
        heading="Check your email"
        message={
          <>
            We sent a verification link to{' '}
            <strong className="text-ink">{registeredEmail}</strong>. Open it to
            activate your account, then sign in.
          </>
        }
        actions={
          <VerificationActions
            resending={resendingVerification}
            onResend={handleResendVerification}
            onSwitchToLogin={switchToLogin}
          />
        }
      />
    );
  }

  return (
    <div className="app-panel">
      <div className="mb-6 text-center">
        <h2
          id="register-heading"
          className="font-display text-xl font-medium tracking-display text-ink sm:text-2xl"
        >
          Create account
        </h2>
        <p className="mt-2 text-muted-strong">Sign up to get started</p>
      </div>

      <RegisterFormFields
        dispatch={dispatch}
        formValues={formValues}
        fieldErrors={fieldErrors}
        touched={touched}
        handleBlur={handleBlur}
        onFieldChange={onFieldChange}
        onPasswordChange={onPasswordChange}
        onConfirmPasswordChange={onConfirmPasswordChange}
        showPassword={showPassword}
        showConfirmPassword={showConfirmPassword}
        loading={loading}
        onSubmit={handleSubmit}
      />

      <FormAlert error={error} />

      <ConfirmDialog {...unsavedDialog} />

      <div className="mt-6 text-center">
        <p className="text-sm text-muted-strong">
          Already have an account?{' '}
          <button
            type="button"
            onClick={switchToLogin}
            className="landing-text-link font-medium"
          >
            Sign in here
          </button>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm;
