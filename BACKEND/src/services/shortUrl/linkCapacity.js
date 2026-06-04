import { MAX_LINKS_PER_USER } from '../../constants/shortUrlLimits.js';
import { countActiveLinksForUser } from '../../dao/shortUrl.dao.js';
import { AppError } from '../../utils/errorHandler.js';

export const isUserAtLinkCapacity = async (userId) => {
  if (!userId) return false;
  const count = await countActiveLinksForUser(userId);
  return count >= MAX_LINKS_PER_USER;
};

export const assertUserLinkCapacity = async (userId) => {
  if (!(await isUserAtLinkCapacity(userId))) return;
  throw new AppError(
    `Link limit reached (${MAX_LINKS_PER_USER}). Delete unused links to create more.`,
    403
  );
};
