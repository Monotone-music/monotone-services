const AdvertiserService = require('../services/advertiser_service');
const TokenService = require('../services/token_service');
const AdBundleService = require('../services/ad_bundle_service');

const asyncHandler = require('../middleware/async_handler');
const CustomError = require("../utils/custom_error");

class AdvertiserController {
  constructor() {
    this.advertiserService = new AdvertiserService();
    this.tokenService = new TokenService();
    this.adBundleService = new AdBundleService();
  }

  getAdvertiserById = asyncHandler(async (req, res) => {
    const accountId = await this.#extractAccountIdFromAccessToken(req);
    const result = await this.advertiserService.getAdvertiserByAccountId(accountId);
    res.status(200).json({status: 'ok', message: 'Advertiser found', data: result});
  });

  updateAdvertiserWithAdBundle = asyncHandler(async (req, res) => {
    const accountId = await this.#extractAccountIdFromAccessToken(req);

    const adBundleObject = {
      name: req.body.name,
      description: req.body.description,
      quota: req.body.quota,
      price: req.body.price,
    }

    const advertiser = await this.advertiserService.getAdvertiserByAccountId(accountId);

    const newAdBundle = await this.adBundleService.updateAdBundleById(advertiser.adBundle._id, adBundleObject);

    res.status(200).json({status: 'ok', message: 'Advertiser updated', data: newAdBundle});
  });

  getRandomAdvertiser = asyncHandler(async (req, res) => {
    const result = await this.advertiserService.getWeightedAdvertiser();
    res.status(200).json({status: 'ok', message: 'Random advertiser selected', data: result});
  });

  getTop5Advertisements = asyncHandler(async (req, res) => {
    const accountId = await this.#extractAccountIdFromAccessToken(req);
    const advertiser = await this.advertiserService.getAdvertiserByAccountId(accountId);
    const result = await this.advertiserService.getTop5Advertisements(advertiser._id);
    res.status(200).json({status: 'ok', message: 'Top 5 advertisements retrieved', data: result});
  });

  getAdvertiserStatistics = asyncHandler(async (req, res) => {
    const accountId = await this.#extractAccountIdFromAccessToken(req);
    const advertiser = await this.advertiserService.getAdvertiserByAccountId(accountId);
    const result = await this.advertiserService.getAdvertiserStatistics(advertiser._id);
    res.status(200).json({status: 'ok', message: 'Advertiser statistics retrieved', data: result});
  });

  getActiveAdvertisements = asyncHandler(async (req, res) => {
    const accountId = await this.#extractAccountIdFromAccessToken(req);
    const advertiser = await this.advertiserService.getAdvertiserByAccountId(accountId);
    const result = await this.advertiserService.getAdvertisementsByStatus(advertiser._id, 'active');
    res.status(200).json({status: 'ok', message: 'Active advertisements retrieved', data: result});
  });

  getRejectedAdvertisements = asyncHandler(async (req, res) => {
    const accountId = await this.#extractAccountIdFromAccessToken(req);
    const advertiser = await this.advertiserService.getAdvertiserByAccountId(accountId);
    const result = await this.advertiserService.getAdvertisementsByStatus(advertiser._id, 'rejected');
    res.status(200).json({status: 'ok', message: 'Rejected advertisements retrieved', data: result});
  });

  getPendingAdvertisements = asyncHandler(async (req, res) => {
    const accountId = await this.#extractAccountIdFromAccessToken(req);
    const advertiser = await this.advertiserService.getAdvertiserByAccountId(accountId);
    const result = await this.advertiserService.getAdvertisementsByStatus(advertiser._id, 'pending');
    res.status(200).json({status: 'ok', message: 'Pending advertisements retrieved', data: result});
  });

  getAdViewLogsPast6Months = asyncHandler(async (req, res) => {
    const accountId = await this.#extractAccountIdFromAccessToken(req);
    const advertiser = await this.advertiserService.getAdvertiserByAccountId(accountId);
    const result = await this.advertiserService.getAdViewLogsPast6Months(advertiser._id);
    res.status(200).json({status: 'ok', message: 'Ad view logs retrieved', data: result});
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

module.exports = new AdvertiserController();