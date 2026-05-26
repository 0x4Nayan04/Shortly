const privacyHighlights = [
  {
    label: 'Minimal collection',
    value: 'Only redirect analytics',
    description: 'We store the least data needed to show useful insights.'
  },
  {
    label: 'No raw IP storage',
    value: 'Derived, then discarded',
    description: 'IP addresses are used only momentarily to resolve country.'
  },
  {
    label: 'Retention window',
    value: '30 days',
    description: 'Raw click events are removed after the retention period.'
  }
];

const PrivacyPage = () => {
  return (
    <main
      id='main-content'
      className='min-h-[calc(100vh-4rem)] bg-gray-50 py-8 px-4'
      role='main'>
      <div className='max-w-5xl mx-auto space-y-6'>
        {/* Header - Structured product feel */}
        <header className='pb-4 border-b border-gray-200'>
          <div className='inline-flex items-center gap-2 rounded bg-indigo-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-700 ring-1 ring-inset ring-indigo-200/50 mb-4'>
            Privacy Promise
          </div>
          <h1 className='text-2xl sm:text-3xl font-bold text-gray-900'>
            Privacy Manifesto
          </h1>
          <p className='mt-2 text-sm sm:text-base text-gray-600 max-w-2xl'>
            Shortly is built as a privacy-first URL shortener. We collect the
            smallest amount of data needed to provide useful analytics, and we
            never sell or share that data with third parties.
          </p>
        </header>

        {/* Highlights Grid - Compact stats style */}
        <div className='grid sm:grid-cols-3 gap-4'>
          {privacyHighlights.map((item) => (
            <article
              key={item.label}
              className='rounded-xl border border-gray-200 bg-white p-5 shadow-sm'>
              <p className='text-xs font-semibold uppercase tracking-wider text-gray-500'>
                {item.label}
              </p>
              <h2 className='mt-1 text-base font-semibold text-gray-900'>
                {item.value}
              </h2>
              <p className='mt-2 text-sm text-gray-600'>{item.description}</p>
            </article>
          ))}
        </div>

        {/* Structured Content Panel - Unified Surface */}
        <div className='rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden'>
          {/* Collection Section */}
          <div className='p-6 sm:p-8 border-b border-gray-100'>
            <div className='flex items-center gap-3 mb-6'>
              <svg
                className='h-5 w-5 text-indigo-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M9 12h6m-6 4h6M7 20h10a2 2 0 002-2V6a2 2 0 00-2-2H7a2 2 0 00-2 2v12a2 2 0 002 2z'
                />
              </svg>
              <h2 className='text-lg font-semibold text-gray-900'>
                What we collect
              </h2>
            </div>

            <p className='text-sm text-gray-600 mb-4'>
              For each redirect, we record:
            </p>

            <div className='grid sm:grid-cols-2 gap-4'>
              <div className='flex flex-col rounded-lg border border-gray-100 bg-gray-50 px-4 py-3'>
                <strong className='text-sm text-gray-900'>Timestamp</strong>
                <span className='text-xs text-gray-600 mt-1'>
                  When the redirect occurred.
                </span>
              </div>
              <div className='flex flex-col rounded-lg border border-gray-100 bg-gray-50 px-4 py-3'>
                <strong className='text-sm text-gray-900'>Country</strong>
                <span className='text-xs text-gray-600 mt-1'>
                  Derived from the request IP at lookup.
                </span>
              </div>
              <div className='flex flex-col rounded-lg border border-gray-100 bg-gray-50 px-4 py-3'>
                <strong className='text-sm text-gray-900'>
                  Referrer domain
                </strong>
                <span className='text-xs text-gray-600 mt-1'>
                  Captured when the browser sends it.
                </span>
              </div>
              <div className='flex flex-col rounded-lg border border-gray-100 bg-gray-50 px-4 py-3'>
                <strong className='text-sm text-gray-900'>
                  User agent details
                </strong>
                <span className='text-xs text-gray-600 mt-1'>
                  Device type, browser, and OS.
                </span>
              </div>
            </div>

            <div className='mt-5 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-800 flex gap-3 items-center'>
              <svg
                className='w-5 h-5 shrink-0 text-blue-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'></path>
              </svg>
              <span>
                We do not store raw IP addresses. We use the IP address only at
                request time to derive a country and discard it immediately.
              </span>
            </div>
          </div>

          {/* Do Not Collect Section */}
          <div className='p-6 sm:p-8 bg-gray-50 border-b border-gray-100 md:grid md:grid-cols-12 gap-6'>
            <div className='md:col-span-4 mb-4 md:mb-0'>
              <h2 className='text-lg font-semibold text-gray-900 mb-1'>
                What we don't collect
              </h2>
              <p className='text-sm text-gray-500'>
                Strict boundaries on your data.
              </p>
            </div>
            <div className='md:col-span-8'>
              <ul className='grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700'>
                <li className='flex items-center gap-3 bg-white px-4 py-3 rounded-lg border border-gray-200 shadow-sm'>
                  <svg
                    className='w-4 h-4 text-red-500'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      d='M6 18L18 6M6 6l12 12'></path>
                  </svg>
                  Full IP addresses
                </li>
                <li className='flex items-center gap-3 bg-white px-4 py-3 rounded-lg border border-gray-200 shadow-sm'>
                  <svg
                    className='w-4 h-4 text-red-500'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      d='M6 18L18 6M6 6l12 12'></path>
                  </svg>
                  Fingerprints
                </li>
                <li className='flex items-center gap-3 bg-white px-4 py-3 rounded-lg border border-gray-200 shadow-sm'>
                  <svg
                    className='w-4 h-4 text-red-500'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      d='M6 18L18 6M6 6l12 12'></path>
                  </svg>
                  Cookies for tracking
                </li>
                <li className='flex items-center gap-3 bg-white px-4 py-3 rounded-lg border border-gray-200 shadow-sm'>
                  <svg
                    className='w-4 h-4 text-red-500'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      d='M6 18L18 6M6 6l12 12'></path>
                  </svg>
                  GPS or exact location
                </li>
                <li className='flex items-center gap-3 bg-white px-4 py-3 rounded-lg border border-gray-200 shadow-sm sm:col-span-2'>
                  <svg
                    className='w-4 h-4 text-red-500'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      d='M6 18L18 6M6 6l12 12'></path>
                  </svg>
                  Personal information about visitors
                </li>
              </ul>
            </div>
          </div>

          {/* Operations & Control (Inline strips) */}
          <div className='p-6 sm:p-8 block sm:grid sm:grid-cols-2 gap-8'>
            <div>
              <h2 className='text-base font-semibold text-gray-900 mb-4'>
                Your Control
              </h2>
              <div className='space-y-3'>
                <div className='text-sm p-3 bg-green-50 border border-green-100 rounded-lg text-green-900 flex gap-2'>
                  <svg
                    className='w-5 h-5 shrink-0 text-green-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'></path>
                  </svg>
                  If you delete a short URL, its analytics are deleted along
                  with it.
                </div>
                <div className='text-sm p-3 bg-green-50 border border-green-100 rounded-lg text-green-900 flex gap-2'>
                  <svg
                    className='w-5 h-5 shrink-0 text-green-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'></path>
                  </svg>
                  Request deletion of your account and associated data at any
                  time.
                </div>
              </div>
            </div>

            <div className='mt-8 sm:mt-0 space-y-6'>
              <div>
                <h2 className='text-base font-semibold text-gray-900 mb-3'>
                  Data Retention
                </h2>
                <ul className='text-sm text-gray-600 space-y-2 list-inside list-disc'>
                  <li>
                    Raw click events are retained for{' '}
                    <strong className='text-gray-900'>30 days</strong>.
                  </li>
                  <li>
                    Aggregated analytics may be kept longer for historical
                    insights.
                  </li>
                </ul>
              </div>
              <div>
                <h2 className='text-base font-semibold text-gray-900 mb-3'>
                  Transparency
                </h2>
                <ul className='text-sm text-gray-600 space-y-2 list-inside list-disc'>
                  <li>Policy updates when analytics practices change.</li>
                  <li>We will always document what changes and why.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default PrivacyPage;
