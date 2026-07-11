import Click from '../schema/click.model.js';
import short_urlModel from '../schema/shortUrl.model.js';

export const insertClick = async (data, session) => {
  const payload = { ...data, timestamp: data.timestamp || new Date() };
  return Click.create([payload], { session });
};

export const deleteClicksForUser = async (userId, session = null) => {
  const opts = session ? { session } : undefined;
  const urlIds = await short_urlModel.find({ user: userId }).distinct('_id');
  if (urlIds.length === 0) return 0;

  const result = await Click.deleteMany(
    { short_url_id: { $in: urlIds } },
    opts
  );
  return result.deletedCount ?? 0;
};

const buildUserClickFacetsPipeline = (userId, since) => [
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
      'url.retiredAt': null,
      timestamp: { $gte: since }
    }
  },
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
];

export const aggregateClickFacetsForUser = async (userId, since) => {
  const [facetResult] = await Click.aggregate(
    buildUserClickFacetsPipeline(userId, since)
  );
  return facetResult;
};
