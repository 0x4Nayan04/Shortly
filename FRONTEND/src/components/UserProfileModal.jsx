import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useFocusTrap } from './Accessibility';

const formatMemberSince = (createdAt) => {
  if (!createdAt) return 'Recently joined';
  return new Date(createdAt).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
};

const UserProfileModal = ({ isOpen, onClose, user, userStats }) => {
  const focusTrapRef = useFocusTrap(isOpen, {
    onEscape: onClose,
    restoreFocus: true
  });

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const totalUrls = userStats?.totalUrls ?? 0;
  const totalClicks = userStats?.totalClicks ?? 0;

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center p-4'
      role='dialog'
      aria-modal='true'
      aria-labelledby='profile-modal-title'>
      <div
        className='absolute inset-0 bg-[color-mix(in_srgb,var(--color-ink)_45%,transparent)] backdrop-blur-sm'
        aria-hidden='true'
        onClick={onClose}
      />
      <div
        ref={focusTrapRef}
        className='user-profile-modal relative app-panel max-h-[90dvh] sm:max-h-[90vh] w-full max-w-md overflow-y-auto scrollbar-hide animate-scale-in !p-0'
        role='document'
        onClick={(e) => e.stopPropagation()}>
        <div className='user-profile-modal__header flex items-center justify-between border-b border-border'>
          <h2
            id='profile-modal-title'
            className='font-display text-lg font-medium tracking-display text-ink'>
            User profile
          </h2>
          <button
            type='button'
            onClick={onClose}
            className='landing-icon-btn'
            aria-label='Close profile modal'>
            <X
              className='h-5 w-5'
              aria-hidden='true'
            />
          </button>
        </div>

        <div className='user-profile-modal__body'>
          <div className='user-profile-modal__profile'>
            <div className='relative shrink-0'>
              <img
                src={user.avatar}
                alt=''
                className='user-profile-modal__avatar'
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.style.display = 'flex';
                }}
              />
              <div
                className='user-profile-modal__avatar user-profile-modal__avatar--fallback'
                style={{ display: 'none' }}
                aria-hidden='true'>
                <span className='font-display text-base font-medium text-primary'>
                  {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <div className='user-profile-modal__identity min-w-0 flex-1'>
              <p className='text-sm font-medium leading-snug text-ink'>
                {user.name}
              </p>
              <p
                className='font-mono text-xs leading-snug text-muted-strong sm:truncate'
                title={user.email}>
                {user.email}
              </p>
            </div>
            <span
              className='user-profile-modal__status shrink-0'
              role='status'>
              Active account
            </span>
          </div>

          <p
            className='user-profile-modal__stats dashboard-workspace-stats-line tabular-nums'
            aria-label={`${totalUrls} URLs created, ${totalClicks} total clicks`}>
            <span>
              <span className='font-mono text-ink'>{totalUrls}</span> URLs created
            </span>
            <span
              className='dashboard-workspace-stats-line__sep'
              aria-hidden='true'>
              ·
            </span>
            <span>
              <span className='font-mono text-ink'>{totalClicks}</span> total clicks
            </span>
          </p>
        </div>

        <div className='user-profile-modal__footer border-t border-border'>
          <p className='user-profile-modal__member-since'>
            Member since{' '}
            <time dateTime={user.createdAt}>{formatMemberSince(user.createdAt)}</time>
          </p>
          <button
            type='button'
            onClick={onClose}
            className='sm-btn sm-btn-primary sm-btn-block'>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
