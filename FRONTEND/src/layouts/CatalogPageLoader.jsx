import { useLayoutEffect } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import { dismissBootSplash } from '../utils/bootSplash';
import CatalogPageShell from './CatalogPageShell';

const CatalogPageLoader = ({ message }) => {
  useLayoutEffect(() => {
    const shell = document.getElementById('landing-lcp-shell');
    if (shell) shell.hidden = true;
    dismissBootSplash();
  }, []);

  return (
    <CatalogPageShell
      mainClassName="flex flex-1 items-center justify-center"
      mainProps={{
        'aria-busy': true,
        'aria-label': message
      }}
    >
      <LoadingSpinner size="lg" message={message} />
    </CatalogPageShell>
  );
};

export default CatalogPageLoader;
