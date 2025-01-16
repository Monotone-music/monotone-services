const AdvertisementService = require('../services/advertisement_service');
const AdvertiserService = require('../services/advertiser_service');
const AdBundleService = require('../services/ad_bundle_service');
const TokenService = require('../services/token_service');

const asyncHandler = require('../middleware/async_handler');
const CustomError = require("../utils/custom_error");

class AdvertisementController {
  constructor() {
    this.advertisementService = new AdvertisementService();
    this.advertiserService = new AdvertiserService();
    this.tokenService = new TokenService();
  }

  createAdvertisement = asyncHandler(async (req, res) => {
    const request = {
      title: req.body.title,
      media: req.files?.media?.[0] || null,
      image: req.files?.image?.[0] || null,
    };

    const advertisementType = req.query.type;

    const accountId = await this.#extractAccountIdFromAccessToken(req);

    const result = await this.advertisementService.createAdvertisement(request, advertisementType, accountId);
    res.status(201).json({status: 'ok', message: 'Advertisement created', data: result});
  });

  getAdvertisement = asyncHandler(async (req, res) => {
    const id = req.params.id;

    const result = await this.advertisementService.getAdvertisementById(id);
    res.status(200).json({status: 'ok', message: 'Advertisement found', data: result});
  });

  getPendingAdvertisements = asyncHandler(async (req, res) => {
    const result = await this.advertisementService.getPendingAdvertisements();
    res.status(200).json({status: 'ok', message: 'Pending advertisements retrieved', data: result});
  });

  approveAdvertisement = asyncHandler(async (req, res) => {
    const id = req.params.id;

    const result = await this.advertisementService.approveAdvertisement(id);
    res.status(200).json({status: 'ok', message: 'Advertisement approved', data: result});
  })

  rejectAdvertisement = asyncHandler(async (req, res) => {
    const id = req.params.id;

    const result = await this.advertisementService.rejectAdvertisement(id);
    res.status(200).json({status: 'ok', message: 'Advertisement rejected', data: result});
  });

  disableAdvertisement = asyncHandler(async (req, res) => {
    const id = req.params.id;

    const result = await this.advertisementService.disableAdvertisement(id);
    res.status(200).json({status: 'ok', message: 'Advertisement updated', data: result});
  });

  getAdvertisementStream = asyncHandler(async (req, res) => {
    const id = req.params.id;

    const result = await this.advertisementService.getAdvertisementStream(id);

    if (!result) {
      return res.status(404).json({status: 'error', message: 'Advertisement stream not found'});
    }

    res.set('Content-Type', result.mimetype)
    res.set('Content-Length', result.buffer.length);

    res.send(result.buffer);
  });

  getRandomPlayerAdFromWeightedAdvertiser = asyncHandler(async (req, res) => {
    const advertisementType = req.query.type;
    const advertiser = await this.advertiserService.getWeightedAdvertiser(advertisementType);
    const advertisement = await this.advertisementService.getRandomAdvertisementFromAdvertiser(advertiser, advertisementType);
    res.status(200).json({status: 'ok', message: 'Random player ad selected', data: advertisement});
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

module.exports = new AdvertisementController();