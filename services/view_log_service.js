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

  async getViewsForLast6Months() {
    try {
      const currentDate = new Date();

      const months = [];
      for (let i = 0; i < 6; i++) {
        const date = new Date(currentDate);
        date.setMonth(date.getMonth() - i);
        months.push(date);
      }

      const monthData = months.map(date => ({
        year: date.getFullYear(),
        month: date.getMonth() + 1
      }));

      const result = await ViewLog.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(monthData[5].year, monthData[5].month - 1, 1),
              $lt: new Date(monthData[0].year, monthData[0].month, 1)
            }
          }
        },
        {
          $group: {
            _id: {
              recording: '$recording',
              month: {$month: '$createdAt'},
              year: {$year: '$createdAt'}
            },
            totalCount: {$sum: '$count'}
          }
        },
        {
          $project: {
            _id: 0,
            recordingId: '$_id.recording',
            count: '$totalCount',
            month: '$_id.month',
            year: '$_id.year'
          }
        },
        {
          $group: {
            _id: {month: '$month', year: '$year'},
            recordings: {
              $push: {
                recordingId: '$recordingId',
                count: '$count'
              }
            }
          }
        },
        {
          $project: {
            month: '$_id.month',
            year: '$_id.year',
            recordings: 1,
            _id: 0
          }
        }
      ]);

      const formattedResult = result.reduce((acc, item) => {
        const monthKey = `${item.month < 10 ? '0' + item.month : item.month}`;
        acc[monthKey] = acc[monthKey] || [];
        acc[monthKey].push(...item.recordings);
        return acc;
      }, {});

      return formattedResult;
    } catch (error) {
      console.error('Error aggregating views:', error);
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