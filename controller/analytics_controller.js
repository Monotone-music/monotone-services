const ViewLogService = require('../services/view_log_service');

const asyncHandler = require('../middleware/async_handler');

class AnalyticsController {
  constructor() {
    this.viewLogService = new ViewLogService();
  }

  getTotalViews = asyncHandler(async (req, res) => {
    const totalViews = await this.viewLogService.getTotalViewsForAllRecordings();
    res.status(200).json({status: 'ok', message: 'Total views retrieved', data: {totalViews: totalViews}});
  });

  getHistoricalTotalViews = asyncHandler(async (req, res) => {
    const totalViews = await this.viewLogService.getHistoricalTotalViews();
    res.status(200).json({status: 'ok', message: 'Total views retrieved', data: {totalViews: totalViews}});
  });
}

module.exports = new AnalyticsController();