import { useLayoutEffect } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import CatalogPageShell from './CatalogPageShell';

const LCP_SHELL_ID = 'landing-lcp-shell';

/**
 * App-route loading state. Hides the static LCP hero shell so it cannot sit
 * above the React navbar + spinner (broken home flash).
 */
const CatalogPageLoader = ({ message }) => {
  useLayoutEffect(() => {
    const shell = document.getElementById(LCP_SHELL_ID);
    if (shell) shell.hidden = true;
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
