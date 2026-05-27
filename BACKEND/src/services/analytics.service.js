import Click from "../schema/click.model.js";
import short_urlModel from "../schema/shortUrl.model.js";

export async function getClickAggregates(userId, days = 30) {
  const userUrls = await short_urlModel
    .find({ user: userId })
    .select("_id")
    .lean();
  const urlIds = userUrls.map((u) => u._id);
  if (urlIds.length === 0) return null;

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [overview, dailyClicks, breakdowns] = await Promise.all([
    Click.aggregate([
      { $match: { short_url_id: { $in: urlIds }, timestamp: { $gte: since } } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          uniqueReferrers: { $addToSet: "$referrer" },
          countries: { $addToSet: "$country" },
        },
      },
      {
        $project: {
          _id: 0,
          total: 1,
          uniqueReferrers: { $size: "$uniqueReferrers" },
          uniqueCountries: { $size: "$countries" },
        },
      },
    ]),

    Click.aggregate([
      { $match: { short_url_id: { $in: urlIds }, timestamp: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          clicks: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    Promise.all([
      Click.aggregate([
        { $match: { short_url_id: { $in: urlIds }, timestamp: { $gte: since } } },
        { $group: { _id: "$country", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      Click.aggregate([
        { $match: { short_url_id: { $in: urlIds }, timestamp: { $gte: since } } },
        { $group: { _id: "$device_type", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Click.aggregate([
        { $match: { short_url_id: { $in: urlIds }, timestamp: { $gte: since } } },
        { $group: { _id: "$browser", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
      Click.aggregate([
        { $match: { short_url_id: { $in: urlIds }, timestamp: { $gte: since } } },
        { $group: { _id: "$os", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
    ]),
  ]);

  return {
    overview: overview[0] || { total: 0, uniqueReferrers: 0, uniqueCountries: 0 },
    clicksOverTime: dailyClicks,
    countries: breakdowns[0],
    devices: breakdowns[1],
    browsers: breakdowns[2],
    operatingSystems: breakdowns[3],
  };
}
