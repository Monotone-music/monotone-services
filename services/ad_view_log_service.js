const AdViewLog = require('../model/ad_view_log');

class AdViewLogService {
  constructor() {
  }

  async createAdViewLog(advertisementId) {
    const adViewLog = new AdViewLog({advertisement: advertisementId});
    await adViewLog.save();
    return adViewLog;
  }

  async getAdViewsLast6Months(advertisementIds) {
    try {
      const currentDate = new Date();
      const startDate = new Date(currentDate.setMonth(currentDate.getMonth() - 6));

      const monthlySummary = await AdViewLog.aggregate([
        {
          $match: {
            advertisement: { $in: advertisementIds },
            createdAt: { $gte: new Date(startDate), $lte: new Date() },
          },
        },
        {
          $project: {
            count: 1,
            month: { $month: "$createdAt" },
          },
        },
        {
          $group: {
            _id: {
              month: "$month",
            },
            totalViews: { $sum: "$count" },
          },
        },
        {
          $project: {
            month: "$_id.month",
            totalViews: 1,
            _id: 0,
          },
        },
        {
          $sort: {
            month: 1,
          },
        },
      ]);
      return monthlySummary;
    } catch (error) {
      console.error('Error calculating monthly summary:', error);
      throw error;
    }
  }
}

module.exports = AdViewLogService;