const AdBundle = require('../model/ad_bundle');
const CustomError = require("../utils/custom_error");

class AdBundleService {
  constructor() {
  }

  async createAdBundle(adBundleData) {
    const insertData = {
      name: adBundleData.name,
      description: adBundleData.description,
      quota: adBundleData.quota,
      price: adBundleData.price,
    };

    const adBundle = new AdBundle(insertData);
    await adBundle.save();
    return adBundle;
  }

  async updateAdBundleById(adBundleId, adBundleData) {
    const adBundle = await AdBundle.findById(adBundleId);

    if (!adBundle) {
      throw new CustomError(404, 'AdBundle not found.');
    }

    adBundle.name = adBundleData.name || adBundle.name;
    adBundle.description = adBundleData.description || adBundle.description;
    adBundle.quota = adBundleData.quota || adBundle.quota;
    adBundle.price = adBundleData.price || adBundle.price;

    await adBundle.save();
    return adBundle;
  }

  async getAdBundleById(adBundleId) {
    const adBundle = await AdBundle.findById(adBundleId);
    return adBundle;
  }

  async increaseQuota(adBundleId, amount) {
    const adBundle = await AdBundle.findById(adBundleId);

    if (!adBundle) {
      throw new CustomError(404, 'AdBundle not found.');
    }

    adBundle.quota = adBundle.quota + amount;
    await adBundle.save();
    return adBundle;
  }

  async decreaseQuota(adBundleId) {
    const adBundle = await AdBundle.findById(adBundleId);

    if (!adBundle) {
      throw new CustomError(404, 'AdBundle not found.');
    }

    adBundle.quota = adBundle.quota - 1;
    await adBundle.save();
    return adBundle
  }
}

module.exports = AdBundleService;