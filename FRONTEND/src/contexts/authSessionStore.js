import { getCurrentUser } from '../api/user.api';
import { getApiPayload } from '../utils/axiosInstance';
import { claimStoredAnonymousLinks } from '../utils/claimAnonymousLinks';

const AUTH_UNAVAILABLE_MESSAGE =
  'We could not verify your session because the authentication service is unavailable.';

let snapshot = { user: null, authChecked: false, authError: null };
const listeners = new Set();
let bootstrapStarted = false;

const publish = () => {
  listeners.forEach((listener) => listener());
};

const isAuthServiceUnavailable = (error) => {
  const status = error?.response?.status;
  return !status || status === 429 || status >= 500;
};

const toAuthError = (error) =>
  isAuthServiceUnavailable(error)
    ? { type: 'unavailable', message: AUTH_UNAVAILABLE_MESSAGE }
    : null;

const startBootstrap = () => {
  if (bootstrapStarted) return;
  bootstrapStarted = true;

  (async () => {
    let response = null;
    let authError = null;
    try {
      response = await getCurrentUser();
    } catch (error) {
      authError = toAuthError(error);
    }
    const userData = response ? getApiPayload(response)?.user : null;
    if (userData) {
      await claimStoredAnonymousLinks();
    }
    snapshot = { user: userData, authChecked: true, authError };
    publish();
  })();
};

export const retryAuthSessionBootstrap = async () => {
  snapshot = { ...snapshot, authChecked: false, authError: null };
  publish();
  bootstrapStarted = false;
  startBootstrap();
};

export const subscribeAuthSession = (listener) => {
  listeners.add(listener);
  startBootstrap();
  return () => listeners.delete(listener);
};

export const getAuthSessionSnapshot = () => snapshot;

export const getAuthSessionServerSnapshot = () => ({
  user: null,
  authChecked: false,
  authError: null
});

export const setAuthSessionUser = (user) => {
  snapshot = { ...snapshot, user, authError: null, authChecked: true };
  publish();
};

export const refreshAuthSessionUser = async () => {
  let response = null;
  let authError = null;
  try {
    response = await getCurrentUser();
  } catch (error) {
    authError = toAuthError(error);
  }
  const userData = response ? getApiPayload(response)?.user : null;
  if (userData) {
    snapshot = {
      ...snapshot,
      user: userData,
      authChecked: true,
      authError: null
    };
  } else if (authError) {
    snapshot = { ...snapshot, authChecked: true, authError };
  } else {
    snapshot = { ...snapshot, user: null, authChecked: true, authError: null };
  }
  publish();
  return userData;
};

export const clearAuthSessionUser = () => {
  snapshot = { ...snapshot, user: null, authError: null, authChecked: true };
  publish();
};
