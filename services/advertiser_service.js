const Advertiser = require('../model/advertiser');

const AdBundleService = require('./ad_bundle_service');
const AdViewLogsService = require('./ad_view_log_service');
const CustomError = require("../utils/custom_error");

class AdvertiserService {
  constructor() {
    this.adBundleService = new AdBundleService();
    this.adViewLogsService = new AdViewLogsService();
  }

  async createAdvertiser(advertiserData) {
    const insertData = {
      displayName: advertiserData.displayName,
      email: advertiserData.email,
      account: advertiserData.account,
      adBundle: advertiserData.adBundle || 'Default',
      advertisement: advertiserData.advertisement || [],
    };

    const newAdBundle = await this.adBundleService.createAdBundle({
      name: insertData.adBundle,
      description: 'Default Ad Bundle',
      quota: 0,
      price: 0,
    })
    insertData.adBundle = newAdBundle._id;

    const advertiser = new Advertiser(insertData);
    await advertiser.save();
    return advertiser;
  }

  async getAdvertiserByAccountId(accountId) {
    const advertiser = await Advertiser.findOne({account: accountId})
      .populate([
        {path: 'adBundle'},
        {
          path: 'advertisement',
          populate: {
            path: 'media image'
          }
        },
      ]);
    return advertiser;
  }

  async getWeightedAdvertiser(adType) {
    const advertisers = await this.#getAdvertiserWithDetails();

    if (!advertisers || advertisers.length === 0) {
      throw new CustomError(404, 'No advertisers available');
    }

    const filteredAdvertisers = advertisers.filter(advertiser =>
      advertiser.advertisement.some(ad => ad.type === adType)
    );

    if (filteredAdvertisers.length === 0) {
      throw new CustomError(404, `No advertisers available for ad type: ${adType}`);
    }

    const advertisersWithWeight = await this.#calculateWeightedAdvertisers(filteredAdvertisers);

    const selectedAdvertiser = this.#selectWeightedAdvertiser(advertisersWithWeight);

    if (!selectedAdvertiser) {
      throw new CustomError(400, 'Failed to select an advertiser');
    }

    return selectedAdvertiser;
  }

  async getTop5Advertisements(advertiserId) {
    const advertiser = await Advertiser.findById(advertiserId)
      .populate('advertisement');

    if (!advertiser) {
      throw new CustomError(404, 'Advertiser not found');
    }

    const activeAdvertisements = advertiser.advertisement
      .filter(ad => ad.status === 'active')
      .sort((a, b) => b.view - a.view);

    return activeAdvertisements.slice(0, 5);
  }

  async getAdViewLogsPast6Months(advertiserId) {
    const advertiser = await Advertiser.findById(advertiserId);

    if (!advertiser) {
      throw new CustomError(404, 'Advertiser not found');
    }

    const adViewLogs = await this.adViewLogsService.getAdViewsLast6Months(advertiser.advertisement);

    return adViewLogs;
  }

  async getAdvertiserStatistics(advertiserId) {
    let totalAds, totalViews, totalPendingAds, quotaRemaining;

    const advertiser = await Advertiser.findById(advertiserId)
      .populate({
        path: 'advertisement',
        select: 'status view',
      })
      .populate({
        path: 'adBundle',
      });

    if (!advertiser) {
      throw new CustomError(404, 'Advertiser not found');
    }
    const activeAds = advertiser.advertisement.filter(ad => ad.status === 'active');

    totalAds = activeAds.length;
    totalViews = advertiser.advertisement.reduce((sum, ad) => sum + ad.view, 0);
    totalPendingAds = advertiser.advertisement.filter(ad => ad.status === 'pending').length;
    quotaRemaining = advertiser.adBundle.quota;

    const result = {
      totalAds: totalAds,
      totalViews: totalViews,
      pendingAmount: totalPendingAds,
      quotaRemaining: quotaRemaining
    }

    return result;
  }

  async getAdvertisementsByStatus(advertiserId, advertisementStatus) {
    const advertiser = await Advertiser.findById(advertiserId)
      .populate('advertisement');

    if (!advertiser) {
      throw new CustomError(404, 'Advertiser not found');
    }

    return await this.aggregateAdvertisementsByType(advertiser, advertisementStatus);
  }

  async aggregateAdvertisementsByType(advertiser, advertisementStatus) {
    const statusFilter = advertisementStatus === 'active'
      ? {$or: [{'advertisement.status': 'active'}, {'advertisement.status': 'inactive'}]}
      : {'advertisement.status': advertisementStatus};

    const result = await Advertiser.aggregate([
      {$match: {_id: advertiser._id}},
      {
        $lookup: {
          from: 'advertisements',
          localField: 'advertisement',
          foreignField: '_id',
          as: 'advertisement',
        },
      },
      {$unwind: '$advertisement'},
      {$match: statusFilter},
      {
        $group: {
          _id: '$advertisement.type',
          advertisements: {$push: '$advertisement'},
        },
      },
      {
        $project: {
          _id: 0,
          type: '$_id',
          advertisements: 1,
        },
      },
    ]);

    const playerAd = result.find(ad => ad.type === 'player_ad') || {advertisements: []};
    const bannerAd = result.find(ad => ad.type === 'banner_ad') || {advertisements: []};

    return {
      player_ad: playerAd.advertisements,
      banner_ad: bannerAd.advertisements,
    };
  }

  async #getAdvertiserWithDetails() {
    const advertisers = await Advertiser.find()
      .populate([
        {path: 'adBundle'},
        {
          path: 'advertisement',
          populate: {path: 'media image'}
        }
      ]);

    return advertisers;
  }

  async #selectWeightedAdvertiser(advertisersWithWeight) {
    const totalWeight = advertisersWithWeight.reduce((sum, {weight}) => sum + weight, 0);
    const random = Math.random() * totalWeight;

    let cumulativeWeight = 0;
    for (const {advertiser, weight} of advertisersWithWeight) {
      cumulativeWeight += weight;
      if (random < cumulativeWeight) {
        return advertiser;
      }
    }

    return null;
  }

  async #calculateWeightedAdvertisers(advertisers) {
    const filteredAdvertisers = advertisers.filter(advertiser => {
      const validAdvertisements = advertiser.advertisement.filter(
        ad => ad.status !== 'inactive' && ad.status !== 'pending'
      );

      advertiser.advertisement = validAdvertisements;

      return validAdvertisements.length > 0;
    });

    const weightedAdvertisers = filteredAdvertisers.map(advertiser => {
      const isBundleActive = advertiser.adBundle.status === 'active';
      const weight = isBundleActive ? 5 : 1;

      return {
        advertiser,
        weight
      };
    });

    return weightedAdvertisers;
  }
}

module.exports = AdvertiserService;