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

const LoadingSpinner = memo(
  ({ size = 'md', message = 'Loading...', fullScreen = false }) => {
    const spinner = (
      <div className="page-loader">
        <BrandedSpinner size={size} label={message || 'Loading'} />
        {message ? <p className="page-loader__caption">{message}</p> : null}
      </div>
    );

    if (fullScreen) {
      return (
        <div className="min-h-[calc(100vh-4rem)] bg-background flex items-center justify-center">
          {spinner}
        </div>
      );
    }

    return spinner;
  }
);

LoadingSpinner.displayName = 'LoadingSpinner';

const AUTH_SKELETON_FIELD_COUNTS = {
  login: 2,
  register: 4,
  compact: 1
};

const AuthSkeletonField = memo(() => (
  <div className="auth-form-skeleton__field">
    <div
      className="auth-form-skeleton__line auth-form-skeleton__line--label sm-skeleton--shimmer"
      aria-hidden="true"
    />
    <div
      className="auth-form-skeleton__line auth-form-skeleton__line--input sm-skeleton--shimmer"
      aria-hidden="true"
    />
  </div>
));

AuthSkeletonField.displayName = 'AuthSkeletonField';

const AuthFormSkeleton = memo(
  ({ variant = 'login', showForgotRow = false, showFooter = true }) => {
    const fieldCount =
      AUTH_SKELETON_FIELD_COUNTS[variant] ?? AUTH_SKELETON_FIELD_COUNTS.login;

    return (
      <div className="app-panel auth-form-skeleton" aria-hidden="true">
        <div className="auth-form-skeleton__header">
          <div className="auth-form-skeleton__line auth-form-skeleton__line--title sm-skeleton--shimmer" />
          <div className="auth-form-skeleton__line auth-form-skeleton__line--subtitle sm-skeleton--shimmer" />
        </div>
        <div className="auth-form-skeleton__fields">
          {Array.from({ length: fieldCount }, (_, i) => (
            <AuthSkeletonField key={i} />
          ))}
        </div>
        {showForgotRow && (
          <div className="auth-form-skeleton__line auth-form-skeleton__line--link sm-skeleton--shimmer" />
        )}
        <div className="auth-form-skeleton__line auth-form-skeleton__line--button sm-skeleton--shimmer" />
        {showFooter && (
          <div className="auth-form-skeleton__line auth-form-skeleton__line--footer sm-skeleton--shimmer" />
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
      <output
        className="auth-page-loader w-full animate-fade-in"
        aria-busy="true"
        aria-label={label}
      >
        <span className="sr-only">{label}</span>
        <AuthFormSkeleton variant={variant} showForgotRow={forgotRow} />
      </output>
    );
  }
);

AuthPageLoader.displayName = 'AuthPageLoader';

export const DashboardStatsGridSkeleton = memo(() => (
  <div className="dashboard-stats-row" aria-hidden="true">
    {[1, 2, 3].map((item) => (
      <div key={item} className="app-panel dashboard-stat-card">
        <div className="sm-skeleton sm-skeleton--shimmer dashboard-card-skeleton__title" />
        <div className="sm-skeleton sm-skeleton--shimmer dashboard-card-skeleton__value" />
      </div>
    ))}
  </div>
));

DashboardStatsGridSkeleton.displayName = 'DashboardStatsGridSkeleton';

export const DashboardInsightsGridSkeleton = memo(() => (
  <div className="dashboard-insights-grid" aria-busy="true" aria-hidden="true">
    {[1, 2].map((item) => (
      <div
        key={item}
        className="app-panel dashboard-insights-panel dashboard-insights-panel--skeleton"
      >
        <div className="sm-skeleton sm-skeleton--shimmer dashboard-insights-skeleton__title" />
        <div className="sm-skeleton sm-skeleton--shimmer dashboard-insights-skeleton__body" />
      </div>
    ))}
  </div>
));

DashboardInsightsGridSkeleton.displayName = 'DashboardInsightsGridSkeleton';

/**
 * Dashboard links list row skeleton — matches catalog list rhythm.
 */
export const UrlTableSkeletonRow = memo(() => (
  <li
    className="dashboard-link-item dashboard-link-item--skeleton dashboard-url-skeleton-row"
    aria-hidden="true"
  >
    <div className="dashboard-link-item__main">
      <div className="sm-skeleton sm-skeleton--shimmer dashboard-url-skeleton-row__check" />
      <div className="dashboard-link-item__body">
        <div className="sm-skeleton sm-skeleton--shimmer dashboard-url-skeleton-row__short" />
        <div className="sm-skeleton sm-skeleton--shimmer dashboard-url-skeleton-row__dest" />
      </div>
      <div className="sm-skeleton sm-skeleton--shimmer dashboard-url-skeleton-row__meta" />
      <div className="dashboard-url-skeleton-row__actions">
        <div className="sm-skeleton sm-skeleton--shimmer dashboard-url-skeleton-row__icon" />
        <div className="sm-skeleton sm-skeleton--shimmer dashboard-url-skeleton-row__icon" />
        <div className="sm-skeleton sm-skeleton--shimmer dashboard-url-skeleton-row__icon" />
      </div>
    </div>
  </li>
));

UrlTableSkeletonRow.displayName = 'UrlTableSkeletonRow';

export default LoadingSpinner;
