import {
  LandingFrameInner,
  LandingSectionBlock
} from '../components/app/AppCatalogShell';
import LoadingSpinner from '../components/LoadingSpinner';
import CatalogPageShell from './CatalogPageShell';

const CatalogPageLoader = ({ message }) => (
  <CatalogPageShell
    mainProps={{
      'aria-busy': true,
      'aria-label': message
    }}>
    <LandingSectionBlock
      label='LOADING'
      index={1}
      total={1}>
      <LandingFrameInner className='flex min-h-[50vh] items-center justify-center py-12'>
        <LoadingSpinner
          size='lg'
          message={message}
        />
      </LandingFrameInner>
    </LandingSectionBlock>
  </CatalogPageShell>
);

export default CatalogPageLoader;
