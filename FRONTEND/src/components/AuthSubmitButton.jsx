import { memo } from 'react';
import { BrandedSpinner } from './LoadingSpinner';

/**
 * Primary auth submit control — disabled + busy state, in-button loader, subtle progress.
 */
const AuthSubmitButton = memo(
  ({
    loading,
    loadingLabel,
    children,
    className = 'sm-btn sm-btn-primary sm-btn-block'
  }) => (
    <button
      type="submit"
      disabled={loading}
      aria-busy={loading}
      className={`${className}${loading ? ' sm-btn--auth-loading' : ''}`.trim()}
    >
      {loading ? (
        <>
          <BrandedSpinner size="sm" decorative />
          <span>{loadingLabel}</span>
        </>
      ) : (
        children
      )}
    </button>
  )
);

AuthSubmitButton.displayName = 'AuthSubmitButton';

export default AuthSubmitButton;
