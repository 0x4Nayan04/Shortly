import { memo } from 'react';

const SPINNER_SIZE_CLASS = {
  sm: 'sm-spinner--sm',
  md: '',
  lg: 'sm-spinner--lg'
};

/**
 * Primary-ring spinner — design-token sm-spinner (auth + app surfaces).
 */
export const BrandedSpinner = memo(
  ({ size = 'md', decorative = false, label = 'Loading' }) => {
    const sizeClass = SPINNER_SIZE_CLASS[size] ?? '';

    return (
      <div
        className={`sm-spinner ${sizeClass}`.trim()}
        role={decorative ? undefined : 'status'}
        aria-hidden={decorative ? true : undefined}
        aria-label={decorative ? undefined : label}
      />
    );
  }
);

BrandedSpinner.displayName = 'BrandedSpinner';

/** @deprecated Use BrandedSpinner — kept for existing imports */
export const AuthBrandedSpinner = BrandedSpinner;

const LoadingSpinner = memo(
  ({ size = 'md', message = 'Loading...', fullScreen = false }) => {
    const spinner = (
      <div className='page-loader'>
        <BrandedSpinner
          size={size}
          label={message || 'Loading'}
        />
        {message ? (
          <p className='page-loader__caption'>{message}</p>
        ) : null}
      </div>
    );

    if (fullScreen) {
      return (
        <div className='min-h-[calc(100vh-4rem)] bg-background flex items-center justify-center'>
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
    className='min-h-[calc(100vh-4rem)] bg-background flex items-center justify-center animate-fade-in'
    role='main'
    aria-busy='true'
    aria-label={message}>
    <LoadingSpinner
      size='lg'
      message={message}
    />
  </main>
));

PageLoader.displayName = 'PageLoader';

const AUTH_SKELETON_FIELD_COUNTS = {
  login: 2,
  register: 4,
  compact: 1
};

const AuthSkeletonField = memo(() => (
  <div className='auth-form-skeleton__field'>
    <div
      className='auth-form-skeleton__line auth-form-skeleton__line--label sm-skeleton--shimmer'
      aria-hidden='true'
    />
    <div
      className='auth-form-skeleton__line auth-form-skeleton__line--input sm-skeleton--shimmer'
      aria-hidden='true'
    />
  </div>
));

AuthSkeletonField.displayName = 'AuthSkeletonField';

/**
 * Branded skeleton matching auth app-panel layout (login / register field counts).
 */
export const AuthFormSkeleton = memo(
  ({ variant = 'login', showForgotRow = false, showFooter = true }) => {
    const fieldCount =
      AUTH_SKELETON_FIELD_COUNTS[variant] ?? AUTH_SKELETON_FIELD_COUNTS.login;

    return (
      <div
        className='app-panel auth-form-skeleton'
        aria-hidden='true'>
        <div className='auth-form-skeleton__header'>
          <div className='auth-form-skeleton__line auth-form-skeleton__line--title sm-skeleton--shimmer' />
          <div className='auth-form-skeleton__line auth-form-skeleton__line--subtitle sm-skeleton--shimmer' />
        </div>
        <div className='auth-form-skeleton__fields'>
          {Array.from({ length: fieldCount }, (_, i) => (
            <AuthSkeletonField key={i} />
          ))}
        </div>
        {showForgotRow && (
          <div className='auth-form-skeleton__line auth-form-skeleton__line--link sm-skeleton--shimmer' />
        )}
        <div className='auth-form-skeleton__line auth-form-skeleton__line--button sm-skeleton--shimmer' />
        {showFooter && (
          <div className='auth-form-skeleton__line auth-form-skeleton__line--footer sm-skeleton--shimmer' />
        )}
      </div>
    );
  }
);

AuthFormSkeleton.displayName = 'AuthFormSkeleton';

/**
 * Auth route suspense fallback — skeleton preview of the form shell.
 */
export const AuthPageLoader = memo(
  ({ variant = 'login', label = 'Loading form...', showForgotRow }) => {
    const forgotRow = showForgotRow ?? variant === 'login';

    return (
      <div
        className='auth-page-loader w-full animate-fade-in'
        role='status'
        aria-busy='true'
        aria-label={label}>
        <span className='sr-only'>{label}</span>
        <AuthFormSkeleton
          variant={variant}
          showForgotRow={forgotRow}
        />
      </div>
    );
  }
);

AuthPageLoader.displayName = 'AuthPageLoader';

export const WorkspaceStatsSkeleton = memo(() => (
  <div
    className='dashboard-workspace-stats-line sm-skeleton sm-skeleton--shimmer dashboard-stat-skeleton__lead'
    aria-hidden='true'
  />
));

WorkspaceStatsSkeleton.displayName = 'WorkspaceStatsSkeleton';

export const DashboardStatsGridSkeleton = memo(() => (
  <div
    className='dashboard-stats-row'
    aria-hidden='true'>
    {[1, 2, 3].map((item) => (
      <div
        key={item}
        className='app-panel dashboard-stat-card'>
        <div className='sm-skeleton sm-skeleton--shimmer dashboard-card-skeleton__title' />
        <div className='sm-skeleton sm-skeleton--shimmer dashboard-card-skeleton__value' />
      </div>
    ))}
  </div>
));

DashboardStatsGridSkeleton.displayName = 'DashboardStatsGridSkeleton';

/**
 * Skeleton loader for stats / analytics cards
 */
export const CardSkeleton = memo(() => (
  <div
    className='app-panel'
    aria-hidden='true'>
    <div className='flex items-center'>
      <div className='sm-skeleton sm-skeleton--shimmer dashboard-card-skeleton__icon' />
      <div className='ml-4 flex-1'>
        <div className='sm-skeleton sm-skeleton--shimmer dashboard-card-skeleton__title' />
        <div className='sm-skeleton sm-skeleton--shimmer dashboard-card-skeleton__value' />
      </div>
    </div>
  </div>
));

CardSkeleton.displayName = 'CardSkeleton';

/**
 * Dashboard links list row skeleton — matches catalog list rhythm.
 */
export const UrlTableSkeletonRow = memo(() => (
  <li
    className='dashboard-link-item dashboard-link-item--skeleton dashboard-url-skeleton-row'
    aria-hidden='true'>
    <div className='dashboard-link-item__main'>
      <div className='sm-skeleton sm-skeleton--shimmer dashboard-url-skeleton-row__check' />
      <div className='dashboard-url-skeleton-row__body'>
        <div className='sm-skeleton sm-skeleton--shimmer dashboard-url-skeleton-row__short' />
        <div className='sm-skeleton sm-skeleton--shimmer dashboard-url-skeleton-row__dest' />
      </div>
      <div className='sm-skeleton sm-skeleton--shimmer dashboard-url-skeleton-row__meta' />
      <div className='dashboard-url-skeleton-row__actions'>
        <div className='sm-skeleton sm-skeleton--shimmer dashboard-url-skeleton-row__icon' />
        <div className='sm-skeleton sm-skeleton--shimmer dashboard-url-skeleton-row__icon' />
        <div className='sm-skeleton sm-skeleton--shimmer dashboard-url-skeleton-row__icon' />
      </div>
    </div>
  </li>
));

UrlTableSkeletonRow.displayName = 'UrlTableSkeletonRow';

/** @deprecated Use UrlTableSkeletonRow */
export const UrlItemSkeleton = memo(() => (
  <div
    className='border border-border p-3'
    aria-hidden='true'>
    <div className='flex items-center gap-3'>
      <div className='sm-skeleton sm-skeleton--shimmer dashboard-url-skeleton-row__check' />
      <div className='flex-1 min-w-0 space-y-1'>
        <div className='sm-skeleton sm-skeleton--shimmer dashboard-url-skeleton-row__short' />
        <div className='sm-skeleton sm-skeleton--shimmer dashboard-url-skeleton-row__dest' />
      </div>
      <div className='flex items-center gap-2 shrink-0'>
        <div className='sm-skeleton sm-skeleton--shimmer dashboard-url-skeleton-row__icon' />
        <div className='sm-skeleton sm-skeleton--shimmer dashboard-url-skeleton-row__icon' />
      </div>
    </div>
  </div>
));

UrlItemSkeleton.displayName = 'UrlItemSkeleton';

/**
 * Skeleton loader for stats cards grid
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
