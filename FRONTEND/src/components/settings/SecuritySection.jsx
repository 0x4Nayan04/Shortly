import { useState } from 'react';
import { changePassword } from '../../api/user.api';
import { getApiErrorMessage } from '../../utils/axiosInstance';
import { getDesignInputClass } from '../../utils/designFormClasses';
import {
  validators,
  validateForm,
  hasErrors,
  getFirstError
} from '../../utils/validation';
import PasswordVisibilityToggle from '../PasswordVisibilityToggle';
import { LoadingButton } from '../UxEnhancements';
import { showToast } from '../../utils/showToast';

const initialPasswordForm = {
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
};

const getPasswordRules = (newPassword) => ({
  oldPassword: validators.loginPassword,
  newPassword: (value) =>
    validators.password(value, { minLength: 6, required: true }),
  confirmPassword: [validators.confirmPassword, newPassword]
});

const PasswordField = ({ id, label, value, onChange, error, autoComplete }) => {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="sm-label">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          className={getDesignInputClass({
            hasError: Boolean(error),
            className: 'pr-12'
          })}
        />
        <PasswordVisibilityToggle
          visible={visible}
          onToggle={() => setVisible((v) => !v)}
        />
      </div>
      {error && <p className="sm-field-error">{error}</p>}
    </div>
  );
};

const SecuritySection = () => {
  const [form, setForm] = useState(initialPasswordForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const updateField = (field) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (form.newPassword && form.newPassword === form.oldPassword) {
      const message =
        'New password must be different from your current password';
      setErrors({ newPassword: message });
      showToast.error(message);
      return;
    }

    const validationErrors = validateForm(
      form,
      getPasswordRules(form.newPassword)
    );
    setErrors(validationErrors);
    if (hasErrors(validationErrors)) {
      const firstError = getFirstError(validationErrors);
      if (firstError) showToast.error(firstError);
      return;
    }

    setLoading(true);
    try {
      await changePassword(form.oldPassword, form.newPassword);
      showToast.success('Password updated successfully');
      setForm(initialPasswordForm);
      setErrors({});
    } catch (err) {
      showToast.error(getApiErrorMessage(err, 'Failed to update password'));
    } finally {
      setLoading(false);
    }
  };

  const submitDisabled =
    loading || !form.oldPassword || !form.newPassword || !form.confirmPassword;

  return (
    <section
      aria-labelledby="settings-security-heading"
      className="app-panel settings-workspace__panel settings-workspace__panel--security"
    >
      <h2
        id="settings-security-heading"
        className="dashboard-shorten-panel__heading"
      >
        Security
      </h2>
      <div className="settings-workspace__panel-body">
        <p className="settings-security__lead">
          Update your password to keep your account secure.
        </p>

        <form
          className="settings-security__form"
          onSubmit={handleSubmit}
          noValidate
        >
          <PasswordField
            id="settings-old-password"
            label="Current password"
            value={form.oldPassword}
            onChange={updateField('oldPassword')}
            error={errors.oldPassword}
            autoComplete="current-password"
          />
          <div className="settings-security__password-row">
            <PasswordField
              id="settings-new-password"
              label="New password"
              value={form.newPassword}
              onChange={updateField('newPassword')}
              error={errors.newPassword}
              autoComplete="new-password"
            />
            <PasswordField
              id="settings-confirm-password"
              label="Confirm password"
              value={form.confirmPassword}
              onChange={updateField('confirmPassword')}
              error={errors.confirmPassword}
              autoComplete="new-password"
            />
          </div>
          <LoadingButton
            type="submit"
            loading={loading}
            loadingText="Updating..."
            className="sm-btn sm-btn-primary w-full md:w-auto"
            disabled={submitDisabled}
          >
            Update password
          </LoadingButton>
        </form>
      </div>
    </section>
  );
};

export default SecuritySection;
