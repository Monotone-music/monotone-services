const Account = require('../model/account');
const CustomError = require("../utils/custom_error");
const validator = require('validator');

const ListenerService = require('./listener_service');
const MembershipService = require('./membership_service');
const LabelService = require('./label_service');

class AccountService {
  constructor() {
    this.listenerService = new ListenerService();
    this.membershipService = new MembershipService();
    this.labelService = new LabelService();
  }

  async createAccount(body) {
    const sanitizedBody = this.#sanitizeBody(body);

    const dupeAccount = await Account.findOne({
      $or: [
        {username: sanitizedBody.username},
        {email: sanitizedBody.email}
      ]
    })

    if (dupeAccount) {
      throw new CustomError(400, 'Account already exists');
    }

    const newAccount = new Account(sanitizedBody);
    await newAccount.save();
  }

  async registerAccount(body, type) {
    const sanitizedBody = this.#sanitizeBody(body);

    const dupeAccount = await Account.findOne({
      $or: [
        {username: sanitizedBody.username},
        {email: sanitizedBody.email}
      ]
    })

    if (dupeAccount) {
      throw new CustomError(400, 'Account already exists');
    }

    const newAccount = new Account(sanitizedBody);
    await newAccount.save();

    switch (type) {
      case 'listener':
        const newListener = await this.listenerService.createListener(sanitizedBody.displayName, newAccount._id);
        const newMembership = await this.membershipService.createMembership('free');
        await this.listenerService.updateListenerMembership(newListener, newMembership._id);
        break;
      case 'label':
        const labelData = {
          displayName: sanitizedBody.displayName,
          email: sanitizedBody.email,
          account: newAccount._id,
          releaseGroup: []
        };

        await this.labelService.createLabel(labelData);
        break;
      default:
        throw new CustomError(400, 'Invalid account type');
    }

    return newAccount;
  }

  #sanitizeBody(body) {
    return {
      username: body.username || '',
      email: body.email || '',
      password: body.password,
      displayName: body.displayName
    };
  }

  async getAccountByUsername(username) {
    return Account.findOne({username: username});
  }
}

module.exports = AccountService;