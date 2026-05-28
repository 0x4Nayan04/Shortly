import LandingFaq from './landing/LandingFaq';
import LandingFeaturesCatalog from './landing/LandingFeaturesCatalog';
import LandingFooter from './landing/LandingFooter';
import LandingFrame, { LandingSectionBlock } from './landing/LandingFrame';
import LandingHero from './landing/LandingHero';
import LandingNavbar from './landing/LandingNavbar';

const LANDING_SECTION_COUNT = 4;

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
        <LandingSectionBlock
          label='SHORTEN'
          index={1}
          total={LANDING_SECTION_COUNT}>
          <LandingHero user={user} />
        </LandingSectionBlock>
        <LandingSectionBlock
          label='PRODUCT CATALOG'
          index={2}
          total={LANDING_SECTION_COUNT}>
          <LandingFeaturesCatalog />
        </LandingSectionBlock>
        <LandingSectionBlock
          label='FAQ'
          index={3}
          total={LANDING_SECTION_COUNT}>
          <LandingFaq />
        </LandingSectionBlock>
      </main>
      <LandingSectionBlock
        label='FOOTER'
        index={4}
        total={LANDING_SECTION_COUNT}>
        <LandingFooter />
      </LandingSectionBlock>
    </LandingFrame>
  </div>
);

export default LandingPage;
