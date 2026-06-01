export function resolveApiBaseUrl() {
  if (import.meta.env.DEV) {
    return '/';
  }

  const configured = import.meta.env.VITE_APP_URL?.trim();
  if (!configured) {
    return null;
  }

  return configured.replace(/\/$/, '');
}

export const apiConfigError =
  !import.meta.env.DEV && !resolveApiBaseUrl()
    ? 'VITE_APP_URL is not set. Set it to your API origin before deploying the app.'
    : null;

export const apiBaseUrl = resolveApiBaseUrl() ?? '/';
