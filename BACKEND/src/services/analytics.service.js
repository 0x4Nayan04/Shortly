import { CLICK_RETENTION_DAYS } from '../constants/shortUrlLimits.js';
import { aggregateClickFacetsForUser } from '../dao/click.dao.js';

const EMPTY_CLICK_FACETS = {
  overviewTotal: [],
  overviewReferrers: [],
  overviewCountries: [],
  dailyClicks: [],
  countries: [],
  devices: [],
  browsers: [],
  operatingSystems: []
};

export async function getClickAggregates(userId, days = CLICK_RETENTION_DAYS) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const rawFacets = await aggregateClickFacetsForUser(userId, since);
  if (!rawFacets) return null;
  const facetResult = rawFacets ?? EMPTY_CLICK_FACETS;

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
