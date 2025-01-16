const jwt = require('jsonwebtoken');
const token = require('../model/token');
const uuid = require('uuid');
const CustomError = require("../utils/custom_error");
const ACCESS_TOKEN_AGE = process.env.ACCESS_TOKEN_AGE || '15m';
const REFRESH_TOKEN_AGE = process.env.REFRESH_TOKEN_AGE || '7d';

const {sendResult} = require('../utils/utils');

class TokenService {
  constructor() {
  }

  generateToken(tokenType, accountId = null) {
    let secret;
    let expiry;
    let payload;

    switch (tokenType) {
      case 'access':
        secret = process.env.JWT_ACCESS_SECRET;
        expiry = ACCESS_TOKEN_AGE;
        payload = {accountId: accountId};
        break;

      case 'refresh':
        secret = process.env.JWT_REFRESH_SECRET;
        expiry = REFRESH_TOKEN_AGE;
        payload = {jti: uuid.v4()};
        break;

      default:
        throw new CustomError(400, 'Invalid token');
    }

    return jwt.sign(payload, secret, {algorithm: 'HS256', expiresIn: expiry});
  }

  verifyToken = function (token, secretType) {
    let secret;
    if (secretType === 'access') {
      secret = process.env.JWT_ACCESS_SECRET;
    } else {
      secret = process.env.JWT_REFRESH_SECRET;
    }
    try {
      if (!token) {
        throw new CustomError(401, 'Token not provided');
      }
      jwt.verify(token, secret);
      return true;
    } catch (ex) {
      switch (ex.name) {
        case 'TokenExpiredError':
          if (secretType === 'access') {
            throw new CustomError(401, 'Token expired');
          } else {
            throw new CustomError(401, 'Login again');
          }
        case 'JsonWebTokenError':
          throw new CustomError(401, 'Invalid signature');
        case 'NotBeforeError':
          throw new CustomError(401, 'Invalid time');
        default:
          throw new CustomError(401, 'Invalid token');
      }
    }
  };

  async saveRefreshToken(accountObjectId, refreshToken) {
    const inquiredToken = await token.findOne({
      $or: [{account: accountObjectId}, {refreshToken: refreshToken}]
    });

    if (inquiredToken) {
      await token.findOneAndDelete({account: accountObjectId});
    }

    const newToken = new token({
      account: accountObjectId,
      refreshToken: refreshToken
    });

    await newToken.save();

    return newToken;
  }

  async regenerateToken(refreshToken, accountObjectId) {
    if (!refreshToken) {
      throw new CustomError(400, 'Refresh token is required');
    }

    const inquiredToken = await token.findOne(
      {
        $or: [
          {refreshToken: refreshToken},
          {account: accountObjectId}
        ]
      });

    if (!inquiredToken) {
      throw new CustomError(404, 'Invalid token');
    }

    await this.removeRefreshToken(accountObjectId);

    const accountId = inquiredToken.account;
    const newAccessToken = this.generateToken('access', accountId);

    // Token Rotation
    const newRefreshToken = this.generateToken('refresh');
    await this.saveRefreshToken(accountId, newRefreshToken);

    const result = {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };

    return result;
  }

  async removeRefreshToken(accountObjectId) {
    let result = true;
    try {
      await token.findOneAndDelete({account: accountObjectId});
    } catch (er) {
      result = false;
    }

    return sendResult(200, 'Refresh token removed successfully', result);
  }

  async getAccountIdFromToken(token) {
    const decoded = jwt.decode(token);
    return decoded.accountId;
  }
}

module.exports = TokenService;
