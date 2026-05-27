import { Link } from 'react-router-dom';
import { ExternalLink, ShieldCheck } from 'lucide-react';

const PrivacyDashboard = ({ stats }) => {
  return (
    <div className='flex items-center justify-between gap-4 bg-white rounded-lg border border-gray-200 px-4 py-3 text-sm'>
      <div className='flex items-center gap-3 min-w-0'>
        <ShieldCheck
          className='w-5 h-5 text-indigo-500 shrink-0'
          aria-hidden='true'
        />
        <span className='text-gray-700 truncate'>
          Privacy-first analytics ·
          {' 30-day retention '}·
          {' '}{(stats?.totalClicks || 0).toLocaleString()} clicks tracked
        </span>
      </div>
      <Link
        to='/privacy'
        className='text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 shrink-0'>
        Read Manifesto
        <ExternalLink
          className='w-3.5 h-3.5'
          aria-hidden='true'
        />
      </Link>
    </div>
  );
};

export default PrivacyDashboard;
