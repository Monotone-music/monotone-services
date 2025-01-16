const bcrypt = require('bcrypt');
const AccountService = require('./account_service');
const TokenService = require('./token_service');
const ListenerService = require('./listener_service');

const CustomError = require("../utils/custom_error");

class AuthService {
  constructor() {
    this.accountService = new AccountService();
    this.tokenService = new TokenService();
    this.listenerService = new ListenerService();
  }

  async login(username, password, flag = 'listener') {
    const account = await this.accountService.getAccountByUsername(username);
    if (!account) {
      throw new CustomError(400, 'Invalid username or password');
    }

    if (['inactive', 'suspended'].includes(account.status)) {
      throw new CustomError(403, 'Account is inactive or suspended');
    }

    let bitrate = '192kbps';

    const accessLevel = account.accessLevel.accessLevel;

    switch (flag) {
      case 'listener':
        if (accessLevel !== 4) {
          throw new CustomError(403, 'Access denied. Insufficient permissions');
        }
        const listener = await this.listenerService.getListenerByAccountId(account._id);
        if (!listener) {
          throw new CustomError(400, 'Invalid username or password');
        }
        bitrate = listener.membership.quality;
        break;
      case 'label':
        if (accessLevel !== 1) {
          throw new CustomError(403, 'Access denied. Insufficient permissions');
        }
        bitrate = null;
        break;
      case 'advertiser':
        if (accessLevel !== 2) {
          throw new CustomError(403, 'Access denied. Insufficient permissions');
        }
        bitrate = null;
        break;
      case 'admin':
        if (accessLevel !== 0) {
          throw new CustomError(403, 'Access denied. Insufficient permissions');
        }
        bitrate = null;
        break;
      case 'artist':
        if (accessLevel !== 3) {
          throw new CustomError(403, 'Access denied. Insufficient permissions');
        }
        bitrate = null;
        break;
    }

    const accessToken = await this.tokenService.generateToken('access', account._id);
    const refreshToken = await this.tokenService.generateToken('refresh');
    await this.tokenService.saveRefreshToken(account._id, refreshToken);

    const isPasswordMatch = await bcrypt.compare(password, account.password);
    if (!isPasswordMatch) {
      throw new CustomError(400, 'Invalid username or password');
    }

    let returnObj = {accessToken: accessToken, refreshToken: refreshToken};

    switch (flag) {
      case 'listener':
        returnObj.bitrate = bitrate;
        break;
      case 'label':
        bitrate = null;
        returnObj.role = 'label';
        break;
      case 'advertiser':
        bitrate = null;
        returnObj.role = 'advertiser';
        break;
      case 'admin':
        bitrate = null;
        returnObj.role = 'admin';
        break;
      case 'artist':
        bitrate = null;
        returnObj.role = 'artist';
        break;
    }

    return returnObj;
  }

  async logout(accountId) {
    if (!accountId) {
      throw new CustomError(400, 'Refresh token is required');
    }

    await this.tokenService.removeRefreshToken(accountId);
  }

  async refreshToken(accessToken, refreshToken, flag = 'listener') {
    if (!refreshToken) {
      throw new CustomError(400, 'Refresh token is required');
    }

    const accountId = await this.tokenService.getAccountIdFromToken(accessToken);

    let bitrate = '192kbps';

    switch (flag) {
      case 'listener':
        const listener = await this.listenerService.getListenerByAccountId(accountId);
        if (!listener) {
          throw new CustomError(400, 'Invalid username or password');
        }
        await listener.populate('membership');

        bitrate = listener.membership.quality;
        break;
      case 'label':
        bitrate = null;
        break;
      case 'advertiser':
        bitrate = null;
        break;
      case 'admin':
        bitrate = null;
        break;
      case 'artist':
        bitrate = null;
        break;
      default:
        bitrate = null;
        break;
    }

    this.tokenService.verifyToken(refreshToken, 'refresh');

    const tokens = await this.tokenService.regenerateToken(refreshToken, accountId);

    let returnObj = {accessToken: tokens.accessToken, refreshToken: tokens.refreshToken};

    switch (flag) {
      case 'listener':
        returnObj.bitrate = bitrate;
        break;
      case 'label':
        bitrate = null;
        returnObj.role = 'label';
        break;
      case 'advertiser':
        bitrate = null;
        returnObj.role = 'advertiser';
        break;
      case 'admin':
        bitrate = null;
        returnObj.role = 'admin';
        break;
      case 'artist':
        bitrate = null;
        returnObj.role = 'artist';
        break;
    }

    return returnObj;
  }

  keepAlive(accessToken) {
    this.tokenService.verifyToken(accessToken, 'access');
    return true
  }
}

module.exports = AuthService;