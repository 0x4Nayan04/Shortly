import Click from '../schema/click.model.js';
import short_urlModel from '../schema/shortUrl.model.js';

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
      timestamp: { $gte: since }
    }
  }
];

export async function getClickAggregates(userId, days = 30) {
  const urlCount = await short_urlModel.countDocuments({ user: userId });
  if (urlCount === 0) return null;

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const baseStages = userClickStages(userId, since);

  const [overview, dailyClicks, breakdowns] = await Promise.all([
    Promise.all([
      Click.aggregate([
        ...baseStages,
        { $group: { _id: null, total: { $sum: 1 } } }
      ]),
      Click.aggregate([
        ...baseStages,
        { $group: { _id: '$referrer' } },
        { $group: { _id: null, count: { $sum: 1 } } }
      ]),
      Click.aggregate([
        ...baseStages,
        { $group: { _id: '$country' } },
        { $group: { _id: null, count: { $sum: 1 } } }
      ])
    ]),

    Click.aggregate([
      ...baseStages,
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          clicks: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]),

    Promise.all([
      Click.aggregate([
        ...baseStages,
        { $group: { _id: '$country', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      Click.aggregate([
        ...baseStages,
        { $group: { _id: '$device_type', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Click.aggregate([
        ...baseStages,
        { $group: { _id: '$browser', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),
      Click.aggregate([
        ...baseStages,
        { $group: { _id: '$os', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ])
    ])
  ]);

  const totalClicks = overview[0]?.[0]?.total || 0;
  const uniqueReferrers = overview[1]?.[0]?.count || 0;
  const uniqueCountries = overview[2]?.[0]?.count || 0;

  return {
    overview: { total: totalClicks, uniqueReferrers, uniqueCountries },
    clicksOverTime: dailyClicks,
    countries: breakdowns[0],
    devices: breakdowns[1],
    browsers: breakdowns[2],
    operatingSystems: breakdowns[3]
  };
}
