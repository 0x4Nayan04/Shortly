import { memo } from 'react';
import { RotateCw } from 'lucide-react';
import { ErrorPanel, errorActionButtonClass } from '../ErrorPanel';
import { ContactSupportHint } from '../legal/ContactChannels';

export const ErrorRecovery = memo(
  ({
    error,
    onRetry,
    retryCount = 0,
    maxRetries = 3,
    title = 'Something went wrong',
    description
  }) => {
    const canRetry = retryCount < maxRetries;

    return (
      <ErrorPanel
        title={title}
        description={
          description ||
          error?.message ||
          'An unexpected error occurred. Please try again.'
        }
      >
        {canRetry && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className={`${errorActionButtonClass} px-4 py-2`}
          >
            <RotateCw className="w-3.5 h-3.5" />
            Try Again {retryCount > 0 && `(${retryCount}/${maxRetries})`}
          </button>
        )}

        {!canRetry && <ContactSupportHint />}
      </ErrorPanel>
    );
  }
);

ErrorRecovery.displayName = 'ErrorRecovery';
