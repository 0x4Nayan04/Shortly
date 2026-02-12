import { memo } from 'react';

/**
 * Reusable loading spinner component
 * Used for Suspense fallbacks and other loading states
 */
const LoadingSpinner = memo(({ size = 'md', message = 'Loading...', fullScreen = false }) => {
  const sizeClasses = {
    sm: 'h-5 w-5 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3',
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center">
      <div
        className={`animate-spin rounded-full border-b-blue-600 border-gray-200 ${sizeClasses[size]}`}
        role="status"
        aria-label="Loading"
      />
      {message && (
        <p className="mt-2 text-gray-600 text-sm">{message}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gray-50 flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
});

LoadingSpinner.displayName = 'LoadingSpinner';

/**
 * Page-level loading component for code-split routes
 */
export const PageLoader = memo(({ message = 'Loading page...' }) => (
  <div className="min-h-[calc(100vh-4rem)] bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3" />
      <p className="text-gray-600">{message}</p>
    </div>
  </div>
));

PageLoader.displayName = 'PageLoader';

/**
 * Skeleton loader for cards
 */
export const CardSkeleton = memo(() => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
    <div className="flex items-center">
      <div className="w-12 h-12 bg-gray-200 rounded-lg" />
      <div className="ml-4 flex-1">
        <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
        <div className="h-6 bg-gray-200 rounded w-16" />
      </div>
    </div>
  </div>
));

CardSkeleton.displayName = 'CardSkeleton';

/**
 * Skeleton loader for URL list items
 */
export const UrlItemSkeleton = memo(() => (
  <div className="border border-gray-200 rounded-lg p-4 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="h-5 bg-gray-200 rounded w-48 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-64 mb-2" />
        <div className="h-3 bg-gray-200 rounded w-24" />
      </div>
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-gray-200 rounded" />
        <div className="w-8 h-8 bg-gray-200 rounded" />
      </div>
    </div>
  </div>
));

UrlItemSkeleton.displayName = 'UrlItemSkeleton';

/**
 * Skeleton loader for stats cards
 */
export const StatsSkeleton = memo(() => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    <CardSkeleton />
    <CardSkeleton />
    <CardSkeleton />
  </div>
));

StatsSkeleton.displayName = 'StatsSkeleton';

export default LoadingSpinner;
