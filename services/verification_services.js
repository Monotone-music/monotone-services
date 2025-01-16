const VerificationToken = require('../model/verification_token');
const Account = require('../model/account');
const CustomError = require("../utils/custom_error");

class VerificationServices {
  constructor() {
  }

  async verifyAccount(token) {
    const verificationToken = await VerificationToken
      .findOne({token: token})
      .populate('account');

    if (!verificationToken) {
      throw new CustomError(400, 'Invalid token');
    }

    const account = await Account.findById(verificationToken.account._id);
    account.status = 'active';
    await account.save();

    await VerificationToken.deleteOne({token: token});

    return account;
  }
}

module.exports = VerificationServices;