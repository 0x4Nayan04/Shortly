import { useState } from 'react';
import { Info } from 'lucide-react';
import { changePassword } from '../api/user.api';
import { getDesignInputClass } from '../utils/designFormClasses';
import {
  validators,
  validateForm,
  hasErrors,
  getFirstError
} from '../utils/validation';
import AppCatalogShell, { LandingFrameInner, LandingSectionBlock } from './app/AppCatalogShell';
import AppNavbar from './app/AppNavbar';
import PasswordVisibilityToggle from './PasswordVisibilityToggle';
import { showToast, LoadingButton } from './UxEnhancements';

const AccountSettings = ({ user, onLogout, onShowAuth, onShowProfile }) => {
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    const errors = validateForm(passwordForm, {
      oldPassword: validators.loginPassword,
      newPassword: (value) =>
        validators.password(value, { minLength: 6, required: true }),
      confirmPassword: [validators.confirmPassword, passwordForm.newPassword]
    });
    setPasswordErrors(errors);

    if (hasErrors(errors)) {
      const firstError = getFirstError(errors);
      if (firstError) showToast.error(firstError);
      return;
    }

    setPasswordLoading(true);
    try {
      await changePassword(passwordForm.oldPassword, passwordForm.newPassword);
      showToast.success('Password updated successfully');
      setPasswordForm({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setPasswordErrors({});
    } catch (error) {
      const apiMessage =
        error?.response?.data?.message || 'Failed to update password';
      showToast.error(apiMessage);
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <AppCatalogShell>
      <AppNavbar
        user={user}
        onLogout={onLogout}
        onShowAuth={onShowAuth}
        onShowProfile={onShowProfile}
      />
      <main
        id='main-content'
        className='flex-1'
        role='main'
        aria-labelledby='settings-heading'>
        <LandingSectionBlock
          label='ACCOUNT'
          index={1}
          total={1}>
          <LandingFrameInner className='landing-section-intro dashboard-workspace-intro'>
            <div className='settings-workspace dashboard-workspace'>
              <div className='dashboard-workspace-head'>
                <header className='dashboard-workspace-hero'>
                  <h1
                    id='settings-heading'
                    className='landing-section-title text-ink'>
                    Account settings
                    <span className='text-primary'>.</span>
                  </h1>
                  <p className='landing-section-lead'>
                    Profile, security, and usage for your Shortly account
                  </p>
                </header>
              </div>

              <div className='settings-workspace__grid'>
                <section
                  aria-labelledby='settings-profile-heading'
                  className='app-panel settings-workspace__panel settings-workspace__panel--profile'>
                  <h2
                    id='settings-profile-heading'
                    className='dashboard-shorten-panel__heading'>
                    Profile
                  </h2>

                <div className='settings-workspace__panel-body'>
                  <div className='settings-profile__identity'>
                    <div className='relative shrink-0'>
                      <img
                        src={user.avatar}
                        alt=''
                        className='settings-profile__avatar'
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'flex';
                        }}
                      />
                      <div
                        className='settings-profile__avatar settings-profile__avatar--fallback'
                        style={{ display: 'none' }}
                        aria-hidden='true'>
                        <span className='font-display text-lg font-medium text-primary'>
                          {(user.name || user.email || 'U')
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className='min-w-0 flex-1'>
                      <p className='font-medium text-ink'>{user.name}</p>
                      <p className='settings-profile__email font-mono text-sm text-muted-strong'>
                        {user.email}
                      </p>
                      <p className='mt-0.5 text-xs text-muted'>
                        Avatar from Gravatar
                      </p>
                    </div>
                  </div>

                  <div className='settings-profile__fields'>
                    <div className='settings-profile__field settings-profile__field--name min-w-0'>
                      <label
                        htmlFor='settings-name'
                        className='sm-label'>
                        Full name
                      </label>
                      <input
                        id='settings-name'
                        type='text'
                        value={user.name}
                        disabled
                        className={`${getDesignInputClass()} w-full min-w-0 cursor-not-allowed opacity-60`}
                      />
                    </div>
                    <div className='settings-profile__field settings-profile__field--email min-w-0'>
                      <span
                        id='settings-email-label'
                        className='sm-label'>
                        Email
                      </span>
                      <p
                        id='settings-email'
                        className='settings-profile__field-value settings-profile__email font-mono text-sm text-ink'
                        aria-labelledby='settings-email-label'>
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <div
                    className='settings-profile__notice'
                    role='note'>
                    <Info
                      className='settings-profile__notice-icon'
                      aria-hidden='true'
                    />
                    <p className='text-sm text-muted-strong'>
                      <span className='font-medium text-ink'>
                        Profile editing coming soon.
                      </span>{' '}
                      Name and email are read-only for now; your avatar follows
                      your Gravatar address.
                    </p>
                  </div>
                </div>
              </section>

              <section
                aria-labelledby='settings-security-heading'
                className='app-panel settings-workspace__panel settings-workspace__panel--security'>
                <h2
                  id='settings-security-heading'
                  className='dashboard-shorten-panel__heading'>
                  Security
                </h2>
                <div className='settings-workspace__panel-body'>
                  <p className='settings-security__lead'>
                    Update your password to keep your account secure.
                  </p>

                  <form
                    className='settings-security__form'
                    onSubmit={handlePasswordChange}
                    noValidate>
                  <div>
                    <label
                      htmlFor='settings-old-password'
                      className='sm-label'>
                      Current password
                    </label>
                    <div className='relative'>
                      <input
                        id='settings-old-password'
                        type={showOldPassword ? 'text' : 'password'}
                        autoComplete='current-password'
                        value={passwordForm.oldPassword}
                        onChange={(e) =>
                          setPasswordForm((prev) => ({
                            ...prev,
                            oldPassword: e.target.value
                          }))
                        }
                        className={getDesignInputClass({
                          hasError: Boolean(passwordErrors.oldPassword),
                          className: 'pr-12'
                        })}
                      />
                      <PasswordVisibilityToggle
                        visible={showOldPassword}
                        onToggle={() => setShowOldPassword((v) => !v)}
                      />
                    </div>
                    {passwordErrors.oldPassword && (
                      <p className='sm-field-error'>
                        {passwordErrors.oldPassword}
                      </p>
                    )}
                  </div>
                  <div className='settings-security__password-row'>
                    <div>
                      <label
                        htmlFor='settings-new-password'
                        className='sm-label'>
                        New password
                      </label>
                      <div className='relative'>
                        <input
                          id='settings-new-password'
                          type={showNewPassword ? 'text' : 'password'}
                          autoComplete='new-password'
                          value={passwordForm.newPassword}
                          onChange={(e) =>
                            setPasswordForm((prev) => ({
                              ...prev,
                              newPassword: e.target.value
                            }))
                          }
                          className={getDesignInputClass({
                            hasError: Boolean(passwordErrors.newPassword),
                            className: 'pr-12'
                          })}
                        />
                        <PasswordVisibilityToggle
                          visible={showNewPassword}
                          onToggle={() => setShowNewPassword((v) => !v)}
                        />
                      </div>
                      {passwordErrors.newPassword && (
                        <p className='sm-field-error'>
                          {passwordErrors.newPassword}
                        </p>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor='settings-confirm-password'
                        className='sm-label'>
                        Confirm password
                      </label>
                      <div className='relative'>
                        <input
                          id='settings-confirm-password'
                          type={showConfirmPassword ? 'text' : 'password'}
                          autoComplete='new-password'
                          value={passwordForm.confirmPassword}
                          onChange={(e) =>
                            setPasswordForm((prev) => ({
                              ...prev,
                              confirmPassword: e.target.value
                            }))
                          }
                          className={getDesignInputClass({
                            hasError: Boolean(passwordErrors.confirmPassword),
                            className: 'pr-12'
                          })}
                        />
                        <PasswordVisibilityToggle
                          visible={showConfirmPassword}
                          onToggle={() => setShowConfirmPassword((v) => !v)}
                        />
                      </div>
                      {passwordErrors.confirmPassword && (
                        <p className='sm-field-error'>
                          {passwordErrors.confirmPassword}
                        </p>
                      )}
                    </div>
                  </div>
                  <LoadingButton
                    type='submit'
                    loading={passwordLoading}
                    loadingText='Updating...'
                    className='sm-btn sm-btn-primary w-full sm:w-auto'
                    disabled={
                      !passwordForm.oldPassword ||
                      !passwordForm.newPassword ||
                      !passwordForm.confirmPassword
                    }>
                    Update password
                  </LoadingButton>
                </form>

                  <div className='settings-security__2fa'>
                    <div className='min-w-0'>
                      <p className='settings-security__2fa-title'>
                        Two-factor authentication
                      </p>
                      <p className='text-sm text-muted'>
                        Extra sign-in protection
                      </p>
                    </div>
                    <button
                      type='button'
                      disabled
                      className='sm-btn sm-btn-secondary shrink-0 cursor-not-allowed opacity-50'>
                      Coming soon
                    </button>
                  </div>
                </div>
              </section>
            </div>
            </div>
          </LandingFrameInner>
        </LandingSectionBlock>
      </main>
    </AppCatalogShell>
  );
};

export default AccountSettings;
