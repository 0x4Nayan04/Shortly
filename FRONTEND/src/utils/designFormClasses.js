/**
 * Shared design-system form class helpers (Phase 0 tokens).
 */

export function getDesignInputClass({ hasError = false, className = '' } = {}) {
  return ['sm-input', hasError ? 'sm-input--error' : '', className]
    .filter(Boolean)
    .join(' ');
}

export const formAlertClass =
  'mt-4 border border-[color-mix(in_srgb,#dc2626_22%,var(--color-border))] bg-[color-mix(in_srgb,#dc2626_6%,var(--color-surface))] p-3 text-sm text-[#dc2626]';

export const formSuccessIconWrapClass =
  'mx-auto mb-4 flex h-16 w-16 items-center justify-center border border-border bg-[var(--color-blue-tint)]';

export const formCompoundClass = (hasError = false) =>
  `hero-form-compound${hasError ? ' hero-form-compound-error' : ''}`;
