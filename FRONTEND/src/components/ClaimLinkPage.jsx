import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Link2, TriangleAlert } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { redeemAnonymousClaimRecovery } from '../api/shortUrl.api';
import { getApiErrorMessage, getApiPayload } from '../utils/axiosInstance';
import { clearAnonymousLinksByIds } from '../utils/anonymousLinks';
import { useAuth } from '../contexts/AuthContext';
import { ROUTES } from '../constants/routes';
import CatalogPageShell from '../layouts/CatalogPageShell';
import {
  LandingFrameInner,
  LandingSectionBlock
} from './app/AppCatalogShell';

const ClaimLinkPage = () => {
  const { token } = useParams();
  const { refetchStats } = useAuth();
  const started = useRef(false);
  const [state, setState] = useState({ status: 'loading', link: null, error: '' });

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const redeem = async () => {
      try {
        const response = await redeemAnonymousClaimRecovery(token);
        const link = getApiPayload(response)?.link;
        if (link?.id) clearAnonymousLinksByIds([link.id]);
        await refetchStats();
        setState({ status: 'success', link, error: '' });
      } catch (error) {
        setState({
          status: 'error',
          link: null,
          error: getApiErrorMessage(
            error,
            'This recovery link could not be claimed.'
          )
        });
      }
    };

    redeem();
  }, [token, refetchStats]);

  return (
    <CatalogPageShell>
      <LandingSectionBlock label="LINK RECOVERY" index={1} total={1}>
        <LandingFrameInner className="flex min-h-[50vh] items-center justify-center py-12">
          <div className="app-panel w-full max-w-lg text-center">
            {state.status === 'loading' && (
              <>
                <Link2 className="mx-auto size-9 text-primary" aria-hidden="true" />
                <h1 className="mt-4 font-display text-2xl font-medium text-ink">
                  Claiming your link…
                </h1>
                <p className="mt-2 text-muted-strong">
                  Keep this page open for a moment.
                </p>
              </>
            )}

            {state.status === 'success' && (
              <>
                <CheckCircle2 className="mx-auto size-9 text-primary" aria-hidden="true" />
                <h1 className="mt-4 font-display text-2xl font-medium text-ink">
                  Link saved to your account
                </h1>
                <p className="mt-2 text-muted-strong">
                  You can now manage it and view its analytics from any device.
                </p>
                <Link to={ROUTES.DASHBOARD} className="sm-btn sm-btn-primary mt-6 inline-flex">
                  Open dashboard
                </Link>
              </>
            )}

            {state.status === 'error' && (
              <>
                <TriangleAlert className="mx-auto size-9 text-danger" aria-hidden="true" />
                <h1 className="mt-4 font-display text-2xl font-medium text-ink">
                  Link could not be claimed
                </h1>
                <p className="mt-2 text-muted-strong" role="alert">
                  {state.error}
                </p>
                <Link to={ROUTES.HOME} className="sm-btn sm-btn-secondary mt-6 inline-flex">
                  Return home
                </Link>
              </>
            )}
          </div>
        </LandingFrameInner>
      </LandingSectionBlock>
    </CatalogPageShell>
  );
};

export default ClaimLinkPage;
