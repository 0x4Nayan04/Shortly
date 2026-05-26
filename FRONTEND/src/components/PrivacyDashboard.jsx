import { Link } from 'react-router-dom';

const PrivacyDashboard = ({ stats }) => {
  return (
    <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6'>
      <div className='flex justify-between items-center mb-6'>
        <div>
          <h2 className='text-2xl font-bold text-gray-800'>
            Privacy Dashboard
          </h2>
          <p className='text-sm text-gray-500 mt-1'>
            We believe in transparent, privacy-first analytics.
          </p>
        </div>
        <Link
          to='/privacy'
          className='text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1'>
          Read our Privacy Manifesto
          <svg
            className='w-4 h-4'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              d='M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14'
            />
          </svg>
        </Link>
      </div>

      <div className='bg-blue-50 border-l-2 border-blue-500 p-4 mb-6 rounded-lg'>
        <h3 className='text-lg font-semibold text-blue-800 mb-2'>
          What we collect (and what we don't)
        </h3>
        <p className='text-blue-700 text-sm mb-3'>
          When someone clicks your links, we temporarily collect minimal data to
          provide you with insights.
          <strong>
            {' '}
            We do not use cookies, we do not fingerprint users, and we do not
            store full IP addresses.
          </strong>
        </p>
        <ul className='text-sm text-blue-800 space-y-1 ml-5 list-disc'>
          <li>
            <strong>Timestamp:</strong> When the link was clicked
          </li>
          <li>
            <strong>Country:</strong> Derived from IP (IP is then discarded)
          </li>
          <li>
            <strong>Device & Browser:</strong> To help you optimize your content
          </li>
          <li>
            <strong>Referrer:</strong> Where the click came from
          </li>
        </ul>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        <div className='bg-gray-50 p-5 rounded-lg border border-gray-200'>
          <div className='text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1'>
            Data Retention
          </div>
          <div className='text-2xl font-bold text-gray-800'>30 Days</div>
          <p className='text-xs text-gray-500 mt-2'>
            Raw click data is automatically deleted after 30 days.
          </p>
        </div>

        <div className='bg-gray-50 p-5 rounded-lg border border-gray-200'>
          <div className='text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1'>
            Total Clicks Tracked
          </div>
          <div className='text-2xl font-bold text-gray-800'>
            {stats?.totalClicks || 0}
          </div>
          <p className='text-xs text-gray-500 mt-2'>
            Across all your active links.
          </p>
        </div>

        <div className='bg-gray-50 p-5 rounded-lg border border-gray-200'>
          <div className='text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1'>
            Your Rights
          </div>
          <div className='text-lg font-bold text-gray-800 mt-1'>
            Full Control
          </div>
          <p className='text-xs text-gray-500 mt-2'>
            Deleting a URL immediately purges all associated analytics.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyDashboard;
