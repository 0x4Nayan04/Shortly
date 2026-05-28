import { Link } from 'react-router-dom';
import { ExternalLink, ShieldCheck } from 'lucide-react';

const PrivacyDashboard = ({ stats, variant = 'panel' }) => {
  const clicksLabel = `${(stats?.totalClicks || 0).toLocaleString()} clicks tracked`;
  const copy = `Privacy-first analytics · 30-day retention · ${clicksLabel}`;

  if (variant === 'meta' || variant === 'chip') {
    return (
      <div className='dashboard-workspace-meta'>
        <span className='dashboard-workspace-meta__copy'>
          <ShieldCheck
            className='dashboard-workspace-meta__icon'
            aria-hidden='true'
          />
          <span className='dashboard-workspace-meta__copy-text'>
            <span className='dashboard-workspace-meta__eyebrow'>Privacy mode</span>
            <span className='dashboard-workspace-meta__description'>{copy}</span>
          </span>
        </span>
        <Link
          to='/privacy'
          className='landing-text-link dashboard-workspace-meta__link'>
          Manifesto
          <ExternalLink
            className='h-3.5 w-3.5'
            aria-hidden='true'
          />
        </Link>
      </div>
    );
  }

  return (
    <div className='app-panel flex items-center justify-between gap-4 !py-3 text-sm'>
      <div className='flex min-w-0 items-center gap-3'>
        <ShieldCheck
          className='h-5 w-5 shrink-0 text-primary'
          aria-hidden='true'
        />
        <span className='truncate text-muted-strong'>{copy}</span>
      </div>
      <Link
        to='/privacy'
        className='landing-text-link flex shrink-0 items-center gap-1 font-medium'>
        Read manifesto
        <ExternalLink
          className='h-3.5 w-3.5'
          aria-hidden='true'
        />
      </Link>
    </div>
  );
};

export default PrivacyDashboard;
