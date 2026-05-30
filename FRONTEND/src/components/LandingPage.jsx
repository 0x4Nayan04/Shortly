import LandingFaq from './landing/LandingFaq';
import LandingFeaturesCatalog from './landing/LandingFeaturesCatalog';
import SiteFooterBar from './landing/SiteFooterBar';
import LandingFrame, { LandingSectionBlock } from './landing/LandingFrame';
import LandingHero from './landing/LandingHero';
import LandingNavbar from './landing/LandingNavbar';

const LandingPage = ({ onLogout, user }) => (
  <div className='landing-page flex min-h-screen flex-col'>
    <LandingFrame>
      <LandingNavbar
        user={user}
        onLogout={onLogout}
      />
      <main
        id='main-content'
        className='flex-1'
        role='main'>
        <LandingSectionBlock>
          <LandingHero user={user} />
        </LandingSectionBlock>
        <LandingSectionBlock>
          <LandingFeaturesCatalog />
        </LandingSectionBlock>
        <LandingSectionBlock>
          <LandingFaq />
        </LandingSectionBlock>
      </main>
      <LandingSectionBlock>
        <SiteFooterBar />
      </LandingSectionBlock>
    </LandingFrame>
  </div>
);

export default LandingPage;
