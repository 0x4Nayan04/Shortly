import { getCountryFromRequest } from '../utils/geoip.js';
import { parseUserAgent } from '../utils/userAgent.js';
import { isBotUserAgent } from '../utils/isBotUserAgent.js';
import { logger } from '../utils/logger.js';
import { runWithTransaction } from '../utils/mongoTransaction.js';
import { incrementClick } from '../dao/shortUrl.dao.js';
import { insertClick } from '../dao/click.dao.js';
import { normalizeReferrerHostname } from '../utils/normalizeReferrerHostname.js';

export async function recordClickFromRequest({ shortUrlId, req }) {
  if (!req) return false;
  if (isBotUserAgent(req.headers['user-agent'] || '')) return false;

  try {
    const referrer = normalizeReferrerHostname(
      req.get('referer') || req.get('referrer') || ''
    );
    const country = getCountryFromRequest(req);
    const { user_agent, device_type, browser, os } = parseUserAgent(req);

    await runWithTransaction(async (session) => {
      await incrementClick(shortUrlId, session);
      await insertClick(
        {
          short_url_id: shortUrlId,
          referrer,
          country,
          user_agent,
          device_type,
          browser,
          os
        },
        session
      );
    });
    return true;
  } catch (error) {
    logger.error('Error recording click', {
      error: error.message,
      shortUrlId
    });
    return false;
  }
}
