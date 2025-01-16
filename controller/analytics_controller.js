const ViewLogService = require('../services/view_log_service');
const RecordingService = require('../services/recording_service');
const AdvertisementService = require('../services/advertisement_service');
const LabelService = require('../services/label_service');
const TokenService = require('../services/token_service');
const PaymentService = require('../services/payment_service');

const asyncHandler = require('../middleware/async_handler');
const CustomError = require("../utils/custom_error");

class AnalyticsController {
  constructor() {
    this.viewLogService = new ViewLogService();
    this.recordingService = new RecordingService();
    this.advertisementService = new AdvertisementService();
    this.labelService = new LabelService();
    this.tokenService = new TokenService();
    this.paymentService = new PaymentService();
  }

  getTotalViews = asyncHandler(async (req, res) => {
    const totalViews = await this.viewLogService.getTotalViewsForAllRecordings();
    res.status(200).json({status: 'ok', message: 'Total views retrieved', data: {totalViews: totalViews}});
  });

  getHistoricalTotalViews = asyncHandler(async (req, res) => {
    const totalViews = await this.viewLogService.getHistoricalTotalViews();
    res.status(200).json({status: 'ok', message: 'Total views retrieved', data: {totalViews: totalViews}});
  });

  getUnapprovedRecordingsAndAdvertisements = asyncHandler(async (req, res) => {
    const recordingCount = await this.recordingService.countUnavailableRecordings();
    const advertisementCount = await this.advertisementService.countPendingAdvertisements();

    res.status(200).json({
      status: 'ok',
      message: 'Unapproved recordings and advertisements retrieved',
      data: {count: recordingCount + advertisementCount}
    });
  });

  getLabelAnalytics = asyncHandler(async (req, res) => {
    const accountId = await this.#extractAccountIdFromAccessToken(req);

    const labelId = await this.labelService.getLabelFromAccountId(accountId);

    const labels = await this.labelService.getTotalLabelTracks(labelId._id);
    res.status(200).json({status: 'ok', message: 'Labels total tracks retrieved', data: labels});
  });

  getPaymentAnalytics = asyncHandler(async (req, res) => {
    const accountId = await this.#extractAccountIdFromAccessToken(req);

    const payments = await this.paymentService.getAllPayments();
    res.status(200).json({status: 'ok', message: 'Payments retrieved', data: payments});
  });

  async #extractAccountIdFromAccessToken(req) {
    const preflightToken = req.header('Authorization')
    let accessToken;
    if (!preflightToken?.startsWith('Bearer ')) {
      throw new CustomError(401, 'Access denied. No token provided');
    } else {
      accessToken = preflightToken.split(' ')[1];
    }

    const accountId = await this.tokenService.getAccountIdFromToken(accessToken);
    return accountId;
  }
}

module.exports = new AnalyticsController();