import { claimAnonymousLinks } from '../api/shortUrl.api';
import { getApiPayload } from './axiosInstance';
import {
  clearClaimedAnonymousLinks,
  readAnonymousLinks
} from './anonymousLinks';

export async function claimStoredAnonymousLinks() {
  const links = readAnonymousLinks();
  if (links.length === 0) return { claimed: [], skipped: [] };

  try {
    const response = await claimAnonymousLinks(links);
    const payload = getApiPayload(response);
    const claimed = payload?.claimed || [];
    clearClaimedAnonymousLinks(claimed.map((entry) => entry.id));
    return { claimed, skipped: payload?.skipped || [] };
  } catch {
    return { claimed: [], skipped: links.map((link) => ({ id: link.id })) };
  }
}
