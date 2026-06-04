import { useState } from 'react';
import { Info } from 'lucide-react';
import { updateProfile } from '../../api/user.api';
import { getApiErrorMessage, getApiPayload } from '../../utils/axiosInstance';
import { getDesignInputClass } from '../../utils/designFormClasses';
import { validators } from '../../utils/validation';
import Avatar from '../Avatar';
import { LoadingButton } from '../UxEnhancements';
import { showToast } from '../../utils/showToast';

const ProfileSection = ({ user, updateUser, refreshUser }) => {
  const [name, setName] = useState(user.name || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const profileDirty = name.trim() !== (user.name || '').trim();
  const emailVerified = user.isEmailVerified !== false;

  const handleNameChange = (event) => {
    setName(event.target.value);
    if (error) setError(validators.name(event.target.value));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nameError = validators.name(name);
    setError(nameError);
    if (nameError) {
      showToast.error(nameError);
      return;
    }
    if (!profileDirty) return;

    const trimmedName = name.trim();
    setLoading(true);
    try {
      const response = await updateProfile(trimmedName);
      const payload = getApiPayload(response);
      const updatedUser = payload?.user ?? { ...user, name: trimmedName };
      updateUser(updatedUser);
      await refreshUser();
      showToast.success(payload?.message || 'Profile updated successfully');
    } catch (err) {
      showToast.error(getApiErrorMessage(err, 'Failed to update profile'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      aria-labelledby="settings-profile-heading"
      className="app-panel settings-workspace__panel settings-workspace__panel--profile"
    >
      <h2
        id="settings-profile-heading"
        className="dashboard-shorten-panel__heading"
      >
        Profile
      </h2>

      <form
        className="settings-workspace__panel-body"
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="settings-profile__identity">
          <Avatar
            src={user.avatar}
            label={name.trim() || user.name || user.email}
            wrapperClassName="relative shrink-0"
            imgClassName="settings-profile__avatar"
            fallbackClassName="settings-profile__avatar settings-profile__avatar--fallback"
            fallbackTextClassName="font-display text-lg font-medium text-primary"
          />
          <div className="settings-profile__summary min-w-0 flex-1">
            <p className="settings-profile__display-name">
              {name.trim() || user.name}
            </p>
            <span
              className={
                emailVerified
                  ? 'settings-profile__badge settings-profile__badge--verified'
                  : 'settings-profile__badge settings-profile__badge--pending'
              }
            >
              {emailVerified ? 'Verified' : 'Pending verification'}
            </span>
          </div>
        </div>

        <div className="settings-profile__fields">
          <div className="settings-profile__field settings-profile__field--name min-w-0">
            <label htmlFor="settings-name" className="sm-label">
              Full name
            </label>
            <input
              id="settings-name"
              type="text"
              value={name}
              onChange={handleNameChange}
              className={getDesignInputClass({
                hasError: Boolean(error),
                className: 'w-full min-w-0'
              })}
              autoComplete="name"
            />
            {error && <p className="sm-field-error">{error}</p>}
          </div>
          <div className="settings-profile__field settings-profile__field--email min-w-0">
            <span id="settings-email-label" className="sm-label">
              Email
            </span>
            <p
              id="settings-email"
              className="settings-profile__field-value settings-profile__email font-mono text-sm text-ink"
              aria-labelledby="settings-email-label"
            >
              {user.email}
            </p>
          </div>
        </div>

        {!emailVerified && (
          <div className="settings-profile__notice" role="note">
            <Info
              className="settings-profile__notice-icon"
              aria-hidden="true"
            />
            <p className="text-sm text-muted-strong">
              Check your inbox for the verification link before signing in on a
              new device.
            </p>
          </div>
        )}

        <LoadingButton
          type="submit"
          loading={loading}
          loadingText="Saving..."
          className="sm-btn sm-btn-primary w-full md:w-auto"
          disabled={!profileDirty || loading}
        >
          Save changes
        </LoadingButton>
      </form>
    </section>
  );
};

export default ProfileSection;
