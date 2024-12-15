const ViewLog = require('../model/view_log');

class ViewService {
  constructor() {
  }

  async insertViewLog(recording) {
    return await ViewLog.create({recording: recording});
  }

  async getTotalViewsForAllRecordings(startDate = null, endDate = new Date()) {
    try {
      if (!startDate) {
        const currentDate = new Date(endDate);
        startDate = new Date(currentDate.setMonth(currentDate.getMonth() - 6));
      }

      const monthlySummary = await ViewLog.aggregate([
        {
          $match: {
            createdAt: {$gte: new Date(startDate), $lte: new Date(endDate)},
          },
        },
        {
          $project: {
            count: 1,
            year: {$year: "$createdAt"},
            month: {$month: "$createdAt"},
          },
        },
        {
          $group: {
            _id: {
              year: "$year",
              month: "$month",
            },
            totalViews: {$sum: "$count"},
          },
        },
        {
          $project: {
            year: "$_id.year",
            month: "$_id.month",
            totalViews: 1,
            _id: 0,
          },
        },
        {
          $sort: {
            year: 1,
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

  async getHistoricalTotalViews() {
    try {
      const totalViews = await ViewLog.aggregate([
        {
          $group: {
            _id: null,
            totalViews: {$sum: "$count"},
          },
        },
        {
          $project: {
            _id: 0,
            totalViews: 1,
          },
        },
      ]);

      return totalViews.length > 0 ? totalViews[0].totalViews : 0;
    } catch (error) {
      console.error('Error calculating historical total views:', error);
      throw error;
    }
  }

}

module.exports = ViewService;