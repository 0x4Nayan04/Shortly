import { createElement, memo } from 'react';
import { AlertTriangle } from 'lucide-react';

const ICON_CIRCLE_STYLE = {
  backgroundColor:
    'color-mix(in srgb, var(--color-error) 10%, var(--color-surface))',
  borderColor: 'color-mix(in srgb, var(--color-error) 30%, var(--color-border))'
};

const PANEL_DOT_BG = {
  backgroundImage: 'var(--grad-dot)',
  backgroundSize: '24px 24px'
};

const VARIANTS = {
  default: {
    panel: 'bg-surface border border-border text-center p-8',
    shadow:
      'rgba(11,16,21,0.06) 0px 1px 0px 0px, rgba(11,16,21,0.18) 0px 6px 16px -10px',
    iconWrap: 'w-12 h-12 mx-auto mb-5',
    title: 'font-display text-lg font-medium text-ink mb-2',
    description: 'text-sm text-muted leading-relaxed mb-6 max-w-sm mx-auto'
  },
  prominent: {
    panel:
      'w-full max-w-md bg-surface border border-border p-10 text-center animate-fade-in',
    shadow:
      'rgba(11,16,21,0.08) 0px 32px 64px -24px, rgba(11,16,21,0.04) 0px 0px 0px 1px',
    iconWrap: 'w-14 h-14 mx-auto mb-6',
    title: 'font-display text-xl font-medium text-ink mb-2',
    description: 'text-sm text-muted leading-relaxed mb-8 max-w-xs mx-auto'
  }
};

export const errorActionButtonClass =
  'inline-flex items-center gap-2 bg-error text-white text-sm font-medium border border-error transition-all duration-150 hover:opacity-90';

export const ErrorPanel = memo(
  ({
    title,
    description,
    headingLevel = 'h3',
    variant = 'default',
    className = '',
    children
  }) => {
    const styles = VARIANTS[variant] ?? VARIANTS.default;

    return (
      <div
        className={`${styles.panel} ${className}`.trim()}
        style={{
          boxShadow: styles.shadow,
          ...PANEL_DOT_BG
        }}
        role="alert"
      >
        <div
          className={`${styles.iconWrap} rounded-full flex items-center justify-center`}
          style={ICON_CIRCLE_STYLE}
        >
          <AlertTriangle className="w-6 h-6 text-error" aria-hidden="true" />
        </div>

        {createElement(headingLevel, { className: styles.title }, title)}

        <p className={styles.description}>{description}</p>

        {children}
      </div>
    );
  }
);

ErrorPanel.displayName = 'ErrorPanel';
