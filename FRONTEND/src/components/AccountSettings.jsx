import { useEffect, useState } from 'react';
import { Info } from 'lucide-react';
import { getUrlStats } from '../api/shortUrl.api';
import { changePassword } from '../api/user.api';
import { showToast, LoadingButton } from './UxEnhancements';
import {
  validators,
  validateForm,
  hasErrors,
  getFirstError
} from '../utils/validation';

const accountLoadingSkeleton = (
  <div className='space-y-4'>
    <div className='animate-pulse'>
      <div className='h-8 bg-gray-200 rounded'></div>
    </div>
    <div className='animate-pulse'>
      <div className='h-8 bg-gray-200 rounded'></div>
    </div>
  </div>
);

const AccountSettings = ({ user }) => {
  const [userStats, setUserStats] = useState({
    totalUrls: 0,
    totalClicks: 0
  });
  const [loading, setLoading] = useState(true);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const response = await getUrlStats();
        const payload = response?.data;
        if (payload?.stats) {
          setUserStats({
            totalUrls: payload.stats.totalUrls || 0,
            totalClicks: payload.stats.totalClicks || 0
          });
        }
      } catch (error) {
        console.error('Error fetching user stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserStats();
  }, []);

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
    } catch (error) {
      const apiMessage =
        error?.response?.data?.message || 'Failed to update password';
      showToast.error(apiMessage);
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className='min-h-[calc(100vh-4rem)] bg-gray-50'>
      <div className='max-w-4xl mx-auto px-4 py-6 sm:py-8'>
        <div className='mb-6 sm:mb-8'>
          <h1 className='text-2xl sm:text-3xl font-bold text-gray-900 mb-2'>
            Account Settings
          </h1>
          <p className='text-gray-600'>
            Manage your account information and preferences
          </p>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Profile Section */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Profile Information */}
            <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6'>
              <h2 className='text-xl font-semibold text-gray-900 mb-6'>
                Profile Information
              </h2>

              <div className='flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mb-6'>
                <div className='relative'>
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className='w-20 h-20 rounded-full shadow-lg'
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextElementSibling.style.display = 'flex';
                    }}
                  />
                  <div className='w-20 h-20 bg-blue-100 rounded-full items-center justify-center shadow-lg hidden'>
                    <span className='text-2xl font-bold text-blue-600'>
                      {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className='flex-1 min-w-0'>
                  <h3 className='text-lg font-medium text-gray-900'>
                    {user.name}
                  </h3>
                  <p className='text-gray-600 break-all'>{user.email}</p>
                  <p className='text-sm text-gray-500 mt-1'>
                    Avatar powered by Gravatar
                  </p>
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Full Name
                  </label>
                  <input
                    type='text'
                    value={user.name}
                    disabled
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Email Address
                  </label>
                  <input
                    type='email'
                    value={user.email}
                    disabled
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed'
                  />
                </div>
              </div>

              <div className='mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg'>
                <div className='flex items-start'>
                  <Info
                    className='w-5 h-5 text-blue-600 mt-0.5 mr-3 shrink-0'
                    aria-hidden='true'
                  />
                  <div>
                    <h4 className='text-sm font-medium text-blue-900'>
                      Profile Editing Coming Soon
                    </h4>
                    <p className='text-sm text-blue-700 mt-1'>
                      Profile editing features will be available in a future
                      update. Your avatar is automatically generated from your
                      email using Gravatar.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Section */}
            <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6'>
              <h2 className='text-xl font-semibold text-gray-900 mb-6'>
                Security
              </h2>

              <div className='space-y-4'>
                <div className='p-4 border border-gray-200 rounded-lg'>
                  <div className='mb-4'>
                    <h3 className='text-sm font-medium text-gray-900'>
                      Password
                    </h3>
                    <p className='text-sm text-gray-600'>
                      Update your password to keep your account secure
                    </p>
                  </div>
                  <form
                    className='space-y-4'
                    onSubmit={handlePasswordChange}>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Current Password
                      </label>
                      <input
                        type='password'
                        value={passwordForm.oldPassword}
                        onChange={(e) =>
                          setPasswordForm((prev) => ({
                            ...prev,
                            oldPassword: e.target.value
                          }))
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500'
                      />
                      {passwordErrors.oldPassword && (
                        <p className='text-sm text-red-600 mt-1'>
                          {passwordErrors.oldPassword}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        New Password
                      </label>
                      <input
                        type='password'
                        value={passwordForm.newPassword}
                        onChange={(e) =>
                          setPasswordForm((prev) => ({
                            ...prev,
                            newPassword: e.target.value
                          }))
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500'
                      />
                      {passwordErrors.newPassword && (
                        <p className='text-sm text-red-600 mt-1'>
                          {passwordErrors.newPassword}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Confirm New Password
                      </label>
                      <input
                        type='password'
                        value={passwordForm.confirmPassword}
                        onChange={(e) =>
                          setPasswordForm((prev) => ({
                            ...prev,
                            confirmPassword: e.target.value
                          }))
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500'
                      />
                      {passwordErrors.confirmPassword && (
                        <p className='text-sm text-red-600 mt-1'>
                          {passwordErrors.confirmPassword}
                        </p>
                      )}
                    </div>
                    <LoadingButton
                      type='submit'
                      loading={passwordLoading}
                      loadingText='Updating...'
                      className='w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg'
                      disabled={
                        !passwordForm.oldPassword ||
                        !passwordForm.newPassword ||
                        !passwordForm.confirmPassword
                      }>
                      Update Password
                    </LoadingButton>
                  </form>
                </div>

                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border border-gray-200 rounded-lg'>
                  <div className='min-w-0'>
                    <h3 className='text-sm font-medium text-gray-900'>
                      Two-Factor Authentication
                    </h3>
                    <p className='text-sm text-gray-600'>
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <button
                    disabled
                    className='w-full sm:w-auto shrink-0 px-4 py-2 text-sm font-medium text-gray-400 bg-gray-100 rounded-lg cursor-not-allowed'>
                    Coming Soon
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className='space-y-6'>
            {/* Account Stats */}
            <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                Account Statistics
              </h3>

              {loading ? (
                accountLoadingSkeleton
              ) : (
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-gray-600'>URLs Created</span>
                    <span className='text-2xl font-bold text-blue-600'>
                      {userStats.totalUrls}
                    </span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-gray-600'>Total Clicks</span>
                    <span className='text-2xl font-bold text-green-600'>
                      {userStats.totalClicks}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
