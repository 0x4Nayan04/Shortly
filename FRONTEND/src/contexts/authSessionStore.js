import { getCurrentUser } from '../api/user.api';
import { getApiPayload } from '../utils/axiosInstance';
import { claimStoredAnonymousLinks } from '../utils/claimAnonymousLinks';

let snapshot = { user: null, authChecked: false };
const listeners = new Set();
let bootstrapStarted = false;

const publish = () => {
  listeners.forEach((listener) => listener());
};

const startBootstrap = () => {
  if (bootstrapStarted) return;
  bootstrapStarted = true;

  (async () => {
    const response = await getCurrentUser().catch(() => null);
    const userData = response ? getApiPayload(response)?.user : null;
    if (userData) {
      await claimStoredAnonymousLinks();
    }
    snapshot = { user: userData, authChecked: true };
    publish();
  })();
};

export const subscribeAuthSession = (listener) => {
  listeners.add(listener);
  startBootstrap();
  return () => listeners.delete(listener);
};

export const getAuthSessionSnapshot = () => snapshot;

export const getAuthSessionServerSnapshot = () => ({
  user: null,
  authChecked: false
});

export const setAuthSessionUser = (user) => {
  snapshot = { ...snapshot, user };
  publish();
};

export const refreshAuthSessionUser = async () => {
  const response = await getCurrentUser().catch(() => null);
  const userData = response ? getApiPayload(response)?.user : null;
  if (userData) {
    snapshot = { ...snapshot, user: userData, authChecked: true };
    publish();
  }
  return userData;
};

export const clearAuthSessionUser = () => {
  snapshot = { ...snapshot, user: null };
  publish();
};
