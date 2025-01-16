const Advertisement = require('../model/advertisement');
const CustomError = require("../utils/custom_error");

const sharp = require('sharp');

const MediaService = require('./media_service');
const ImageService = require('./image_service');
const AdvertiserService = require('./advertiser_service');
const AdViewLogService = require('./ad_view_log_service');
const AdBundleService = require('./ad_bundle_service');

const fs = require('fs');

class AdvertisementService {
  constructor() {
    this.mediaService = new MediaService();
    this.imageService = new ImageService();
    this.advertiserService = new AdvertiserService();
    this.adViewLogService = new AdViewLogService();
    this.adBundleService = new AdBundleService();
  }

  async createAdvertisement(advertisementData, advertisementType, accountId) {
    const insertData = {
      title: advertisementData.title,
      type: advertisementType,
    };

    switch (advertisementType) {
      case 'player_ad':
        if (!advertisementData.media || !advertisementData.image) {
          throw new CustomError(400, 'Player ads require both media and image.');
        }
        await this.#handlePlayerAd(insertData, advertisementData);
        break;
      case 'banner_ad':
        if (!advertisementData.image) {
          throw new CustomError(400, 'Banner ads require an image.');
        }
        await this.#handleBannerAd(insertData, advertisementData);
        break;
      default:
        throw new CustomError(400, 'Invalid advertisement type.');
    }

    const query = {
      $or: [],
    };

    if (insertData.media) query.$or.push({media: insertData.media});
    if (insertData.image) query.$or.push({image: insertData.image});

    if (query.$or.length > 0) {
      const existingAdvertisement = await Advertisement.findOne(query);
      if (existingAdvertisement) {
        if (advertisementData.image?.path) fs.unlinkSync(advertisementData.image.path);
        throw new CustomError(409, 'Advertisement already exists.');
      }
    }

    const advertisement = new Advertisement(insertData);
    await advertisement.save();

    if (advertisementData.image?.path) fs.unlinkSync(advertisementData.image.path);

    const advertiser = await this.advertiserService.getAdvertiserByAccountId(accountId);
    advertiser.advertisement.push(advertisement._id);
    await advertiser.save();

    return advertisement;
  }

  async getAdvertisementById(advertisementId) {
    const advertisement = await Advertisement.findById(advertisementId).populate('media image');

    return advertisement;
  }

  async getRandomAdvertisementFromAdvertiser(advertiser, advertisementType) {
    if (!advertiser || !Array.isArray(advertiser.advertisement)) {
      throw new CustomError(404, 'Invalid advertiser data or missing advertisements');
    }

    if (advertiser.advertisement.length === 0) {
      throw new CustomError(404, 'No advertisements available');
    }

    switch (advertisementType) {
      case 'player_ad':
        advertiser.advertisement = advertiser.advertisement.filter(ad => ad.type === 'player_ad');
        break;
      case 'banner_ad':
        advertiser.advertisement = advertiser.advertisement.filter(ad => ad.type === 'banner_ad');
        break;
      default:
        throw new CustomError(400, 'Invalid advertisement type');
    }

    const randomIndex = Math.floor(Math.random() * advertiser.advertisement.length);

    const advertisementId = advertiser.advertisement[randomIndex]._id;

    const advertisement = await Advertisement.findById(advertisementId).populate('media image');

    await this.adViewLogService.createAdViewLog(advertisementId);
    if (advertisement.view == null) {
      advertisement.view = 0;
    }

    advertisement.view += 1;
    await advertisement.save();

    await this.adBundleService.decreaseQuota(advertiser.adBundle._id, 1);

    return advertiser.advertisement[randomIndex];
  }

  async getAdvertisementStream(advertisementId) {
    const advertisement = await Advertisement.findById(advertisementId).populate('media image');

    if (!advertisement) {
      throw new CustomError(404, 'Advertisement not found.');
    }

    const stream = await this.mediaService.getAdvertisementStreamByFilename(advertisement.media.filename);

    return stream;
  }

  async getPendingAdvertisements() {
    const pendingAdvertisements = await Advertisement.find({status: 'pending'})
      .populate('media image');

    const groupedAdvertisements = pendingAdvertisements.reduce((groups, ad) => {
      if (!groups[ad.type]) {
        groups[ad.type] = [];
      }
      groups[ad.type].push(ad);
      return groups;
    }, {});

    return groupedAdvertisements;
  }

  async approveAdvertisement(advertisementId) {
    const advertisement = await Advertisement.findById(advertisementId);

    if (!advertisement) {
      throw new CustomError(404, 'Advertisement not found.');
    }

    advertisement.status = 'active';
    await advertisement.save();

    return advertisement;
  }

  async rejectAdvertisement(advertisementId) {
    const advertisement = await Advertisement.findById(advertisementId);

    if (!advertisement || ['rejected', 'active'].includes(advertisement.status)) {
      throw new CustomError(404, 'Advertisement not found.');
    }

    advertisement.status = 'rejected';
    await advertisement.save();

    return advertisement;
  }

  async disableAdvertisement(advertisementId) {
    const advertisement = await Advertisement.findById(advertisementId);

    if (!advertisement) {
      throw new CustomError(404, 'Advertisement not found.');
    }

    const flippedStatus = advertisement.status === 'active' ? 'inactive' : 'active';

    advertisement.status = flippedStatus;
    await advertisement.save();

    return advertisement;
  }

  async countPendingAdvertisements() {
    return await Advertisement.countDocuments({status: 'pending'});
  }

  async #handlePlayerAd(insertData, advertisementData) {
    const imageData = await this.#processImage(advertisementData.image, 'player_ad');
    const mediaData = this.#prepareMediaData(advertisementData.media);

    const media = await this.mediaService.uploadAdvertisementMedia(mediaData, 'player_ad');
    insertData.media = media._id;

    const image = await this.imageService.insertImage(imageData, 'player_ad');
    insertData.image = image._id;
  }

  async #handleBannerAd(insertData, advertisementData) {
    const imageData = await this.#processImage(advertisementData.image, 'banner_ad');

    const image = await this.imageService.insertImage(imageData, 'banner_ad');
    insertData.image = image._id;
  }

  async #processImage(image, type) {
    const imageBuffer = fs.readFileSync(image.path);
    let resizedBuffer;
    switch (type) {
      case 'player_ad':
        resizedBuffer = await sharp(imageBuffer)
          .resize(500, 500, {fit: 'cover', position: 'center'})
          .toBuffer();
        break;
      case 'banner_ad':
        resizedBuffer = await sharp(imageBuffer)
          .resize(1000, 200, {fit: 'fill'})
          .toBuffer();
        break;
      default:
        throw new CustomError(400, 'Invalid advertisement type');
    }

    const metadata = await sharp(resizedBuffer).metadata();

    return {
      filename: image.filename,
      format: image.mimetype,
      width: metadata.width,
      height: metadata.height,
      data: resizedBuffer,
    };
  }

  #prepareMediaData(media) {
    return {
      filename: media.filename,
      originalName: media.originalname,
      size: media.size,
      mimetype: media.mimetype,
      buffer: fs.readFileSync(media.path),
      path: media.path,
    };
  }
}

module.exports = AdvertisementService;