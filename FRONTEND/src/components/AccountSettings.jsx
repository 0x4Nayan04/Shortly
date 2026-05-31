import { useEffect, useState } from 'react';
import { Info, ShieldAlert } from 'lucide-react';
import { changePassword, deleteAccount, updateProfile } from '../api/user.api';
import {
  getApiErrorMessage,
  getApiMessage,
  getApiUser
} from '../utils/axiosInstance';
import { getDesignInputClass } from '../utils/designFormClasses';
import {
  validators,
  validateForm,
  hasErrors,
  getFirstError
} from '../utils/validation';
import AppCatalogShell, {
  LandingFrameInner,
  LandingSectionBlock
} from './app/AppCatalogShell';
import AppNavbar from './app/AppNavbar';
import PasswordVisibilityToggle from './PasswordVisibilityToggle';
import Avatar from './Avatar';
import { showToast, LoadingButton } from './UxEnhancements';
import { useAuth } from '../contexts/AuthContext';

const AccountSettings = () => {
  const { user, updateUser, handleAccountDeleted } = useAuth();
  const [name, setName] = useState(user.name || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});
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
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    setName(user.name || '');
  }, [user.name]);

  const profileDirty = name.trim() !== (user.name || '').trim();
  const emailVerified = user.isEmailVerified !== false;
  const deleteConfirmed =
    deleteConfirmEmail.trim().toLowerCase() === user.email?.toLowerCase();

  const handleProfileSave = async (event) => {
    event.preventDefault();
    const nameError = validators.name(name);
    setProfileErrors({ name: nameError });

    if (nameError) {
      showToast.error(nameError);
      return;
    }

    if (!profileDirty) {
      return;
    }

    setProfileLoading(true);
    try {
      const response = await updateProfile(name.trim());
      const updatedUser = getApiUser(response);
      if (updatedUser) {
        updateUser(updatedUser);
      }
      showToast.success(
        getApiMessage(response, 'Profile updated successfully')
      );
    } catch (error) {
      showToast.error(getApiErrorMessage(error, 'Failed to update profile'));
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();

    if (
      passwordForm.newPassword &&
      passwordForm.oldPassword &&
      passwordForm.newPassword === passwordForm.oldPassword
    ) {
      setPasswordErrors({
        newPassword: 'New password must be different from your current password'
      });
      showToast.error(
        'New password must be different from your current password'
      );
      return;
    }

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
      showToast.error(getApiErrorMessage(error, 'Failed to update password'));
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async (event) => {
    event.preventDefault();

    if (!deleteConfirmed) {
      showToast.error('Enter your email address to confirm deletion.');
      return;
    }

    setDeleteLoading(true);
    try {
      await deleteAccount();
      showToast.success('Your account has been deleted.');
      handleAccountDeleted();
    } catch (error) {
      showToast.error(getApiErrorMessage(error, 'Failed to delete account'));
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <AppCatalogShell>
      <AppNavbar />
      <main
        id='main-content'
        className='flex-1'
        aria-labelledby='settings-heading'>
        <LandingSectionBlock>
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

                  <form
                    className='settings-workspace__panel-body'
                    onSubmit={handleProfileSave}
                    noValidate>
                    <div className='settings-profile__identity'>
                      <Avatar
                        src={user.avatar}
                        label={name.trim() || user.name || user.email}
                        wrapperClassName='relative shrink-0'
                        imgClassName='settings-profile__avatar'
                        fallbackClassName='settings-profile__avatar settings-profile__avatar--fallback'
                        fallbackTextClassName='font-display text-lg font-medium text-primary'
                      />
                      <div className='settings-profile__summary min-w-0 flex-1'>
                        <p className='settings-profile__display-name'>
                          {name.trim() || user.name}
                        </p>
                        <span
                          className={
                            emailVerified
                              ? 'settings-profile__badge settings-profile__badge--verified'
                              : 'settings-profile__badge settings-profile__badge--pending'
                          }>
                          {emailVerified ? 'Verified' : 'Pending verification'}
                        </span>
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
                          value={name}
                          onChange={(e) => {
                            setName(e.target.value);
                            if (profileErrors.name) {
                              setProfileErrors({
                                name: validators.name(e.target.value)
                              });
                            }
                          }}
                          className={getDesignInputClass({
                            hasError: Boolean(profileErrors.name),
                            className: 'w-full min-w-0'
                          })}
                          autoComplete='name'
                        />
                        {profileErrors.name && (
                          <p className='sm-field-error'>{profileErrors.name}</p>
                        )}
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

                    {!emailVerified && (
                      <div
                        className='settings-profile__notice'
                        role='note'>
                        <Info
                          className='settings-profile__notice-icon'
                          aria-hidden='true'
                        />
                        <p className='text-sm text-muted-strong'>
                          Check your inbox for the verification link before
                          signing in on a new device.
                        </p>
                      </div>
                    )}

                    <LoadingButton
                      type='submit'
                      loading={profileLoading}
                      loadingText='Saving...'
                      className='sm-btn sm-btn-primary w-full md:w-auto'
                      disabled={!profileDirty || profileLoading}>
                      Save changes
                    </LoadingButton>
                  </form>
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
                                hasError: Boolean(
                                  passwordErrors.confirmPassword
                                ),
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
                        className='sm-btn sm-btn-primary w-full md:w-auto'
                        disabled={
                          !passwordForm.oldPassword ||
                          !passwordForm.newPassword ||
                          !passwordForm.confirmPassword
                        }>
                        Update password
                      </LoadingButton>
                    </form>
                  </div>
                </section>
              </div>

              <section
                aria-labelledby='settings-danger-heading'
                className='app-panel settings-workspace__panel settings-workspace__panel--danger'>
                <h2
                  id='settings-danger-heading'
                  className='dashboard-shorten-panel__heading settings-danger__heading'>
                  <ShieldAlert
                    className='settings-danger__heading-icon'
                    aria-hidden='true'
                  />
                  <span>Delete account</span>
                </h2>
                <div className='settings-workspace__panel-body'>
                  <p className='settings-danger__lead'>
                    Permanently remove your account and all short links you
                    created. This cannot be undone.
                  </p>
                  <form
                    className='settings-danger__form'
                    onSubmit={handleDeleteAccount}
                    noValidate>
                    <div>
                      <label
                        htmlFor='settings-delete-email'
                        className='sm-label'>
                        Type your email to confirm
                      </label>
                      <input
                        id='settings-delete-email'
                        type='email'
                        value={deleteConfirmEmail}
                        onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                        placeholder={user.email}
                        autoComplete='off'
                        className={getDesignInputClass({
                          className: 'w-full'
                        })}
                      />
                    </div>
                    <LoadingButton
                      type='submit'
                      loading={deleteLoading}
                      loadingText='Deleting...'
                      className='settings-danger__submit sm-btn w-full md:w-auto'
                      disabled={!deleteConfirmed || deleteLoading}>
                      Delete my account
                    </LoadingButton>
                  </form>
                </div>
              </section>
            </div>
          </LandingFrameInner>
        </LandingSectionBlock>
      </main>
    </AppCatalogShell>
  );
};

export default AccountSettings;
