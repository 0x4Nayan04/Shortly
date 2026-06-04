import { useAuth } from '../contexts/AuthContext';
import AppCatalogShell, {
  LandingFrameInner,
  LandingSectionBlock
} from './app/AppCatalogShell';
import AppNavbar from './app/AppNavbar';
import ProfileSection from './settings/ProfileSection';
import SecuritySection from './settings/SecuritySection';
import DeleteAccountSection from './settings/DeleteAccountSection';

const AccountSettings = () => {
  const { user, updateUser, refreshUser, handleAccountDeleted } = useAuth();

  return (
    <AppCatalogShell>
      <AppNavbar />
      <main
        id="main-content"
        className="flex-1"
        aria-labelledby="settings-heading"
      >
        <LandingSectionBlock>
          <LandingFrameInner className="landing-section-intro dashboard-workspace-intro">
            <div className="settings-workspace dashboard-workspace">
              <div className="dashboard-workspace-head">
                <header className="dashboard-workspace-hero">
                  <h1
                    id="settings-heading"
                    className="landing-section-title text-ink"
                  >
                    Account settings
                    <span className="text-primary">.</span>
                  </h1>
                  <p className="landing-section-lead">
                    Profile, security, and usage for your Shortly account
                  </p>
                </header>
              </div>

              <div className="settings-workspace__grid">
                <ProfileSection
                  key={`${user._id}-${user.name ?? ''}`}
                  user={user}
                  updateUser={updateUser}
                  refreshUser={refreshUser}
                />
                <SecuritySection />
              </div>

              <DeleteAccountSection
                userEmail={user.email}
                onDeleted={handleAccountDeleted}
              />
            </div>
          </LandingFrameInner>
        </LandingSectionBlock>
      </main>
    </AppCatalogShell>
  );
};

export default AccountSettings;
