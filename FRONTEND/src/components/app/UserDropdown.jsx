import {
  ChevronDown,
  Flag,
  LayoutDashboard,
  LogOut,
  Settings,
  User
} from 'lucide-react';
import Avatar from '../Avatar';

const NavUserAvatar = ({ user }) => (
  <Avatar
    src={user.avatar}
    label={user.name || user.email}
    className="nav-user-avatar"
    fallbackClassName="nav-user-avatar-fallback"
    width={28}
    height={28}
  />
);

const UserDropdown = ({
  user,
  isAdmin = false,
  isDropdownOpen,
  setIsDropdownOpen,
  dropdownButtonRef,
  focusTrapRef,
  toggleDropdown,
  handleDropdownKeyDown,
  handleNavigateDashboard,
  handleShowProfileClick,
  handleNavigateSettings,
  handleNavigateAbuseQueue,
  handleLogoutClick
}) => {
  const accountLabel = user?.name || user?.email || 'Account';
  const firstName =
    user?.name?.trim().split(/\s+/)[0] ||
    user?.email?.split('@')[0] ||
    'Account';

  return (
    <div className="relative min-w-0">
      <button
        type="button"
        ref={dropdownButtonRef}
        onClick={toggleDropdown}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' && !isDropdownOpen) {
            e.preventDefault();
            setIsDropdownOpen(true);
          }
        }}
        className="nav-user-trigger"
        aria-expanded={isDropdownOpen}
        aria-haspopup="true"
        aria-controls="app-user-menu"
        aria-label={`Account menu for ${accountLabel}`}
      >
        <NavUserAvatar user={user} />
        <span className="nav-user-trigger-name">{firstName}</span>
        <ChevronDown className="nav-user-trigger-chevron" aria-hidden="true" />
      </button>

      {isDropdownOpen && (
        <div
          ref={focusTrapRef}
          id="app-user-menu"
          role="menu"
          tabIndex={-1}
          aria-label="Account menu"
          onKeyDown={handleDropdownKeyDown}
          className="nav-user-menu animate-slide-down"
        >
          <div className="nav-user-menu-identity">
            {user.name ? (
              <p className="nav-user-menu-name">{user.name}</p>
            ) : null}
            <p className="nav-user-menu-email">{user.email}</p>
          </div>

          <p className="nav-user-menu-section" id="app-user-menu-section">
            Account
          </p>

          <div
            className="nav-user-menu-list"
            aria-labelledby="app-user-menu-section"
          >
            <button
              type="button"
              onClick={handleNavigateDashboard}
              role="menuitem"
              tabIndex={0}
              className="nav-user-menu-row"
            >
              <LayoutDashboard
                className="nav-user-menu-row-icon"
                aria-hidden="true"
              />
              <span className="nav-user-menu-row-label">Dashboard</span>
            </button>
            <button
              type="button"
              onClick={handleShowProfileClick}
              role="menuitem"
              tabIndex={0}
              className="nav-user-menu-row"
            >
              <User className="nav-user-menu-row-icon" aria-hidden="true" />
              <span className="nav-user-menu-row-label">View profile</span>
            </button>
            <button
              type="button"
              onClick={handleNavigateSettings}
              role="menuitem"
              tabIndex={0}
              className="nav-user-menu-row"
            >
              <Settings className="nav-user-menu-row-icon" aria-hidden="true" />
              <span className="nav-user-menu-row-label">Settings</span>
            </button>
            {isAdmin ? (
              <button
                type="button"
                onClick={handleNavigateAbuseQueue}
                role="menuitem"
                tabIndex={0}
                className="nav-user-menu-row"
              >
                <Flag className="nav-user-menu-row-icon" aria-hidden="true" />
                <span className="nav-user-menu-row-label">Abuse queue</span>
              </button>
            ) : null}
          </div>

          <div className="nav-user-menu-footer" aria-label="Session">
            <button
              type="button"
              onClick={handleLogoutClick}
              role="menuitem"
              tabIndex={0}
              className="nav-user-menu-row nav-user-menu-row--danger"
            >
              <LogOut className="nav-user-menu-row-icon" aria-hidden="true" />
              <span className="nav-user-menu-row-label">
                Sign out everywhere
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDropdown;
