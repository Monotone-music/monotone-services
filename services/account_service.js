const Account = require('../model/account');
const CustomError = require("../utils/custom_error");
const {ObjectId} = require('mongoose').Types;

const ListenerService = require('./listener_service');
const MembershipService = require('./membership_service');
const LabelService = require('./label_service');
const AdvertiserService = require('./advertiser_service');
const AccessLevelService = require('./access_level_service');
const ArtistService = require('./artist_service');

const {sendEmail} = require('../services/email_service');

class AccountService {
  constructor() {
    this.listenerService = new ListenerService();
    this.membershipService = new MembershipService();
    this.labelService = new LabelService();
    this.advertiserService = new AdvertiserService();
    this.accessLevelService = new AccessLevelService();
    this.artistService = new ArtistService();
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
    });

    if (dupeAccount) {
      throw new CustomError(400, 'Account already exists');
    }

    const newAccount = new Account(sanitizedBody);
    await newAccount.save();

    let accessLevel;
    switch (type) {
      case 'listener':
        await sendEmail(sanitizedBody.email, newAccount._id, 'verification');
        accessLevel = await this.accessLevelService.getAccessLevelByLevel(4);
        newAccount.accessLevel = accessLevel._id;
        await newAccount.save();

        const [newListener, newMembership] = await Promise.all([
          this.listenerService.createListener(sanitizedBody.displayName, newAccount._id),
          this.membershipService.createMembership('free')
        ]);
        await this.listenerService.updateListenerMembership(newListener, newMembership._id);
        break;
      case 'label':
        await sendEmail(sanitizedBody.email, newAccount._id, 'verification');
        accessLevel = await this.accessLevelService.getAccessLevelByLevel(1);
        newAccount.accessLevel = accessLevel._id;
        await newAccount.save();

        const labelData = {
          displayName: sanitizedBody.displayName,
          email: sanitizedBody.email,
          account: newAccount._id,
          releaseGroup: []
        };
        await this.labelService.createLabel(labelData);
        break;
      case 'advertiser':
        await sendEmail(sanitizedBody.email, newAccount._id, 'verification');
        accessLevel = await this.accessLevelService.getAccessLevelByLevel(2);
        newAccount.accessLevel = accessLevel._id;
        await newAccount.save();

        const advertiserData = {
          displayName: sanitizedBody.displayName,
          email: sanitizedBody.email,
          account: newAccount._id,
          adBundle: 'Default Ad Bundle',
        };
        await this.advertiserService.createAdvertiser(advertiserData);
        break;
      case 'artist':
        await sendEmail(sanitizedBody.email, newAccount._id, 'verification');
        accessLevel = await this.accessLevelService.getAccessLevelByLevel(3);
        newAccount.accessLevel = accessLevel._id;
        await newAccount.save();

        const artistData = {
          name: sanitizedBody.displayName,
          email: sanitizedBody.email,
          account: newAccount._id,
          labelId: new ObjectId('6785c6e59b2f03e63be692cf')
        }
        await this.artistService.createArtistViaRegistration(artistData);
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
    return await Account.findOne({username: username}).populate(
      {path: 'accessLevel'}
    );
  }

  async getAccountById(id) {
    return await Account.findById(id).populate(
      {path: 'accessLevel'}
    );
  }

  async getAccountEmailFromAccountId(accountId) {
    const account = await Account.findById(accountId);
    return account.email;
  }
}

module.exports = AccountService;