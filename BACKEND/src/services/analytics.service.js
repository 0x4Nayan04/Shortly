import Click from '../schema/click.model.js';
import short_urlModel from '../schema/shortUrl.model.js';
import { CLICK_RETENTION_DAYS } from '../constants/shortUrlLimits.js';

const userClickStages = (userId, since) => [
  {
    $lookup: {
      from: short_urlModel.collection.name,
      localField: 'short_url_id',
      foreignField: '_id',
      as: 'url'
    }
  },
  { $unwind: '$url' },
  {
    $match: {
      'url.user': userId,
      'url.deletedAt': null,
      timestamp: { $gte: since }
    }
  }
];

export async function getClickAggregates(userId, days = CLICK_RETENTION_DAYS) {
  const urlCount = await short_urlModel.countDocuments({
    user: userId,
    deletedAt: null
  });
  if (urlCount === 0) return null;

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const baseStages = userClickStages(userId, since);

  const [facetResult] = await Click.aggregate([
    ...baseStages,
    {
      $facet: {
        overviewTotal: [{ $group: { _id: null, total: { $sum: 1 } } }],
        overviewReferrers: [
          { $group: { _id: '$referrer' } },
          { $group: { _id: null, count: { $sum: 1 } } }
        ],
        overviewCountries: [
          { $group: { _id: '$country' } },
          { $group: { _id: null, count: { $sum: 1 } } }
        ],
        dailyClicks: [
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
              },
              clicks: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ],
        countries: [
          { $group: { _id: '$country', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ],
        devices: [
          { $group: { _id: '$device_type', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ],
        browsers: [
          { $group: { _id: '$browser', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 5 }
        ],
        operatingSystems: [
          { $group: { _id: '$os', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 5 }
        ]
      }
    }
  ]);

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
