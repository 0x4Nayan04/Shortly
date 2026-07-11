import { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { deleteAccount } from '../../api/user.api';
import { getApiErrorMessage } from '../../utils/axiosInstance';
import { getDesignInputClass } from '../../utils/designFormClasses';
import { LoadingButton } from '../UxEnhancements';
import { showToast } from '../../utils/showToast';

const DeleteAccountSection = ({ userEmail, onDeleted }) => {
  const [confirmEmail, setConfirmEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const confirmed =
    confirmEmail.trim().toLowerCase() === userEmail?.toLowerCase();

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!confirmed) {
      showToast.error('Enter your email address to confirm deletion.');
      return;
    }
    setLoading(true);
    try {
      await deleteAccount(password);
      showToast.success('Your account has been deleted.');
      onDeleted();
    } catch (err) {
      showToast.error(getApiErrorMessage(err, 'Failed to delete account'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      aria-labelledby="settings-danger-heading"
      className="app-panel settings-workspace__panel settings-workspace__panel--danger"
    >
      <h2
        id="settings-danger-heading"
        className="dashboard-shorten-panel__heading settings-danger__heading"
      >
        <ShieldAlert
          className="settings-danger__heading-icon"
          aria-hidden="true"
        />
        <span>Delete account</span>
      </h2>
      <div className="settings-workspace__panel-body">
        <p className="settings-danger__lead">
          Permanently remove your account, destinations, and analytics. Public
          slugs remain retired so they can never be reused. This cannot be
          undone.
        </p>
        <form
          className="settings-danger__form"
          onSubmit={handleSubmit}
          noValidate
        >
          <div>
            <label htmlFor="settings-delete-email" className="sm-label">
              Type your email to confirm
            </label>
            <input
              id="settings-delete-email"
              type="email"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              placeholder={userEmail}
              autoComplete="off"
              className={getDesignInputClass({
                className: 'w-full'
              })}
            />
          </div>
          <div>
            <label htmlFor="settings-delete-password" className="sm-label">
              Current password
            </label>
            <input
              id="settings-delete-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className={getDesignInputClass({ className: 'w-full' })}
              required
            />
          </div>
          <LoadingButton
            type="submit"
            loading={loading}
            loadingText="Deleting..."
            className="settings-danger__submit sm-btn w-full md:w-auto"
            disabled={!confirmed || !password || loading}
          >
            Delete my account
          </LoadingButton>
        </form>
      </div>
    </section>
  );
};

export default DeleteAccountSection;
