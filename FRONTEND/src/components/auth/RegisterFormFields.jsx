import { Link } from 'react-router-dom';
import AuthSubmitButton from '../AuthSubmitButton';
import FormField from '../forms/FormField';
import PasswordField from '../forms/PasswordField';
import PasswordStrengthMeter from './PasswordStrengthMeter';
import PasswordHint from './PasswordHint';
import { ROUTES } from '../../constants/routes';

const RegisterFormFields = ({
  dispatch,
  formValues,
  fieldErrors,
  touched,
  handleBlur,
  onFieldChange,
  onPasswordChange,
  onConfirmPasswordChange,
  showPassword,
  showConfirmPassword,
  acceptedTerms,
  loading,
  onSubmit
}) => {
  const { name, email, password, confirmPassword } = formValues;

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4"
      aria-labelledby="register-heading"
    >
      <FormField
        id="register-name"
        label="Full name"
        type="text"
        value={name}
        onChange={(e) => {
          dispatch({ type: 'SET_FIELD', field: 'name', value: e.target.value });
          onFieldChange(
            'name',
            { ...formValues, name: e.target.value },
            { clearError: () => dispatch({ type: 'SET_ERROR', value: '' }) }
          );
        }}
        onBlur={() => handleBlur('name', formValues)}
        error={fieldErrors.name}
        touched={touched.name}
        placeholder="Enter your full name"
        autoComplete="name"
      />

      <FormField
        id="register-email"
        label="Email address"
        type="email"
        value={email}
        onChange={(e) => {
          dispatch({
            type: 'SET_FIELD',
            field: 'email',
            value: e.target.value
          });
          onFieldChange(
            'email',
            { ...formValues, email: e.target.value },
            { clearError: () => dispatch({ type: 'SET_ERROR', value: '' }) }
          );
        }}
        onBlur={() => handleBlur('email', formValues)}
        error={fieldErrors.email}
        touched={touched.email}
        placeholder="Enter your email"
        autoComplete="email"
      />

      <div>
        <PasswordField
          id="register-password"
          label="Password"
          value={password}
          onChange={onPasswordChange}
          onBlur={() => handleBlur('password', formValues)}
          error={fieldErrors.password}
          touched={touched.password}
          placeholder="Enter your password"
          autoComplete="new-password"
          showPassword={showPassword}
          onToggleVisibility={() => dispatch({ type: 'TOGGLE_PASSWORD' })}
        />
        <PasswordHint
          password={password}
          hasError={Boolean(fieldErrors.password)}
        />
        <PasswordStrengthMeter password={password} />
      </div>

      <PasswordField
        id="register-confirm-password"
        label="Confirm password"
        value={confirmPassword}
        onChange={onConfirmPasswordChange}
        onBlur={() => handleBlur('confirmPassword', formValues)}
        error={fieldErrors.confirmPassword}
        touched={touched.confirmPassword}
        placeholder="Confirm your password"
        autoComplete="new-password"
        showPassword={showConfirmPassword}
        onToggleVisibility={() => dispatch({ type: 'TOGGLE_CONFIRM_PASSWORD' })}
      />

      <div className="flex items-start gap-3 border border-border bg-[var(--color-surface-muted)] px-4 py-3">
        <input
          id="register-accepted-terms"
          type="checkbox"
          checked={acceptedTerms}
          onChange={() => dispatch({ type: 'TOGGLE_ACCEPTED_TERMS' })}
          className="mt-0.5 size-4 shrink-0 accent-primary"
          aria-describedby="register-terms-description"
        />
        <label
          htmlFor="register-accepted-terms"
          id="register-terms-description"
          className="text-sm text-muted-strong"
        >
          I agree to the{' '}
          <Link to={ROUTES.TERMS} className="landing-text-link font-medium">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link to={ROUTES.PRIVACY} className="landing-text-link font-medium">
            Privacy Policy
          </Link>
          .
        </label>
      </div>

      <AuthSubmitButton loading={loading} loadingLabel="Creating account…">
        Create account
      </AuthSubmitButton>
    </form>
  );
};

export default RegisterFormFields;
