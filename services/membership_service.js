const Membership = require('../model/membership');
const CustomError = require("../utils/custom_error");

class MembershipService {
  constructor() {
  }

  /**
   * Create a new membership
   * @param {string} type - Membership type
   * @param {number} price - Membership price
   * @param {string} description - Membership description
   * @param {number} durationInDays - Membership duration in days
   * @returns {Promise<Object>} - New membership
   */
  async createMembership(type) {
    const currentDate = new Date();
    let quality, price, description, durationInDays = 30;

    switch (type) {
      case 'basic':
        price = 5;
        description = 'basic membership';
        quality = '320kbps';
        break;
      case 'premium':
        price = 10;
        description = 'premium membership';
        quality = 'lossless';
        break;
      default:
        type = 'free';
        price = 0;
        description = 'free membership';
        quality = '192kbps';
        durationInDays = 0;
        break;
    }

    const membershipData = {
      type: type,
      start: currentDate,
      end: type === 'free' ? null : new Date(currentDate.getTime()).setDate(currentDate.getDate() + durationInDays),
      price: price,
      description: description,
      quality: quality,
    }

    const newMembership = new Membership(membershipData);
    await newMembership.save();

    return newMembership;
  }
}

module.exports = MembershipService;