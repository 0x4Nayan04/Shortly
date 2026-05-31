import LandingFaq from './landing/LandingFaq';
import LandingFeaturesCatalog from './landing/LandingFeaturesCatalog';
import LandingFooter from './landing/LandingFooter';
import LandingFrame, { LandingSectionBlock } from './landing/LandingFrame';
import LandingHero from './landing/LandingHero';
import LandingNavbar from './landing/LandingNavbar';

const LandingPage = () => (
  <div className='landing-page flex min-h-screen flex-col'>
    <LandingFrame>
      <LandingNavbar />
      <main
        id='main-content'
        className='flex-1'>
        <LandingSectionBlock>
          <LandingHero />
        </LandingSectionBlock>
        <LandingSectionBlock>
          <LandingFeaturesCatalog />
        </LandingSectionBlock>
        <LandingSectionBlock>
          <LandingFaq />
        </LandingSectionBlock>
      </main>
      <LandingSectionBlock className='site-footer-block'>
        <LandingFooter />
      </LandingSectionBlock>
    </LandingFrame>
  </div>
);

export default LandingPage;
