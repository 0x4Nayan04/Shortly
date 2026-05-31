import { memo } from 'react';
import { Inbox } from 'lucide-react';

export const EmptyState = memo(
  ({
    icon,
    title,
    description,
    action,
    actionLabel,
    variant = 'default'
  }) => {
    const variantStyles = {
      default: 'bg-surface border border-border',
      muted: 'bg-[var(--color-surface-muted)] border border-border',
      illustrated: 'bg-[var(--color-blue-tint)] border border-border'
    };

    const defaultIcon = (
      <Inbox
        className='w-12 h-12 text-muted'
        strokeWidth={1.5}
        aria-hidden='true'
      />
    );

    return (
      <div className={`text-center py-12 px-6 ${variantStyles[variant]}`}>
        <div className='w-20 h-20 bg-[var(--color-surface-muted)] border border-border mx-auto mb-6 flex items-center justify-center'>
          {icon || defaultIcon}
        </div>

        <h3 className='text-xl font-semibold text-ink mb-2'>{title}</h3>

        {description && (
          <p className='text-muted-strong mb-6 max-w-sm mx-auto'>
            {description}
          </p>
        )}

        {action && actionLabel && (
          <button
            onClick={action}
            className='sm-btn sm-btn-primary'>
            {actionLabel}
          </button>
        )}
      </div>
    );
  }
);

EmptyState.displayName = 'EmptyState';
