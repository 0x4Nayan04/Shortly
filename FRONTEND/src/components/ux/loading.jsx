import { memo } from 'react';

export const LoadingButton = memo(
  ({ loading, disabled, children, loadingText, className = '', ...props }) => {
    return (
      <button
        type="button"
        disabled={loading || disabled}
        aria-busy={loading}
        className={`relative transition-all ${className} ${loading ? 'cursor-wait' : ''}`}
        {...props}
      >
        <span
          className={`flex items-center justify-center gap-2 ${loading ? 'opacity-0' : 'opacity-100'}`}
        >
          {children}
        </span>
        {loading && (
          <span className="absolute inset-0 flex items-center justify-center gap-2">
            <span className="sm-spinner sm-spinner--sm" aria-hidden="true" />
            {loadingText && <span>{loadingText}</span>}
          </span>
        )}
      </button>
    );
  }
);

LoadingButton.displayName = 'LoadingButton';
