import { memo } from 'react';

const LoadingSpinner = memo(
  ({ size = 'md', message = 'Loading...', fullScreen = false }) => {
    const sizeClasses = {
      sm: 'h-5 w-5 border-2',
      md: 'h-8 w-8 border-2',
      lg: 'h-12 w-12 border-3'
    };

    const spinner = (
      <div className='flex flex-col items-center justify-center'>
        <div
          className={`animate-spin rounded-full border-b-indigo-600 border-gray-200 ${sizeClasses[size]}`}
          role='status'
          aria-label='Loading'
        />
        {message && <p className='mt-2 text-gray-600 text-sm'>{message}</p>}
      </div>
    );

    if (fullScreen) {
      return (
        <div className='min-h-[calc(100vh-4rem)] bg-gray-50 flex items-center justify-center'>
          {spinner}
        </div>
      );
    }

    return spinner;
  }
);

LoadingSpinner.displayName = 'LoadingSpinner';

export const PageLoader = memo(({ message = 'Loading page...' }) => (
  <main
    id='main-content'
    className='min-h-[calc(100vh-4rem)] bg-gray-50 flex items-center justify-center animate-fade-in'
    role='main'
    aria-busy='true'
    aria-label='Loading page'>
    <div className='flex flex-col items-center justify-center gap-4'>
      <div
        className='h-12 w-12 rounded-full border-2 border-indigo-100 border-t-indigo-600 animate-spin'
        aria-hidden='true'
      />
      <p className='text-gray-600 text-sm font-medium'>{message}</p>
    </div>
  </main>
));

PageLoader.displayName = 'PageLoader';

/**
 * Skeleton loader for cards
 */
export const CardSkeleton = memo(() => (
  <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse'>
    <div className='flex items-center'>
      <div className='w-12 h-12 bg-gray-200 rounded-lg' />
      <div className='ml-4 flex-1'>
        <div className='h-4 bg-gray-200 rounded w-24 mb-2' />
        <div className='h-6 bg-gray-200 rounded w-16' />
      </div>
    </div>
  </div>
));

CardSkeleton.displayName = 'CardSkeleton';

/**
 * Skeleton loader for URL list items
 */
export const UrlItemSkeleton = memo(() => (
  <div className='border border-gray-200 rounded-lg p-3 animate-pulse'>
    <div className='flex items-center gap-3'>
      <div className='w-4 h-4 bg-gray-200 rounded shrink-0' />
      <div className='flex-1 min-w-0'>
        <div className='h-4 bg-gray-200 rounded w-40 mb-1' />
        <div className='h-3 bg-gray-200 rounded w-56' />
      </div>
      <div className='flex items-center gap-2 shrink-0'>
        <div className='w-6 h-6 bg-gray-200 rounded' />
        <div className='w-6 h-6 bg-gray-200 rounded' />
      </div>
    </div>
  </div>
));

UrlItemSkeleton.displayName = 'UrlItemSkeleton';

/**
 * Skeleton loader for stats cards
 */
export const StatsSkeleton = memo(() => (
  <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
    <CardSkeleton />
    <CardSkeleton />
    <CardSkeleton />
  </div>
));

StatsSkeleton.displayName = 'StatsSkeleton';

export default LoadingSpinner;
