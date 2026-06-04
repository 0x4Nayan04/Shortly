import { CLICK_RETENTION_DAYS } from '../constants/shortUrlLimits.js';
import { countActiveLinksForUser } from '../dao/shortUrl.dao.js';
import { aggregateClickFacetsForUser } from '../dao/click.dao.js';

export async function getClickAggregates(userId, days = CLICK_RETENTION_DAYS) {
  const urlCount = await countActiveLinksForUser(userId);
  if (urlCount === 0) return null;

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const facetResult = await aggregateClickFacetsForUser(userId, since);

  const totalClicks = facetResult.overviewTotal[0]?.total || 0;
  const uniqueReferrers = facetResult.overviewReferrers[0]?.count || 0;
  const uniqueCountries = facetResult.overviewCountries[0]?.count || 0;

  return {
    periodDays: days,
    retentionDays: CLICK_RETENTION_DAYS,
    overview: { total: totalClicks, uniqueReferrers, uniqueCountries },
    clicksOverTime: facetResult.dailyClicks,
    countries: facetResult.countries,
    devices: facetResult.devices,
    browsers: facetResult.browsers,
    operatingSystems: facetResult.operatingSystems
  };
}
