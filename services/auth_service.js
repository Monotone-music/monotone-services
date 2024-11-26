const bcrypt = require('bcrypt');
const AccountService = require('./account_service');
const TokenService = require('./token_service');
const CustomError = require("../utils/custom_error");

class AuthService {
  constructor() {
    this.accountService = new AccountService();
    this.tokenService = new TokenService();
  }

  async login(username, password) {
    const account = await this.accountService.getAccountByUsername(username);
    if (!account) {
      throw new CustomError(400, 'Invalid username or password');
    }

    const accessToken = await this.tokenService.generateToken('access', account._id);
    const refreshToken = await this.tokenService.generateToken('refresh');
    await this.tokenService.saveRefreshToken(account._id, refreshToken);

    const isPasswordMatch = await bcrypt.compare(password, account.password);
    if (!isPasswordMatch) {
      throw new CustomError(400, 'Invalid username or password');
    }

    return {accessToken: accessToken, refreshToken: refreshToken};
  }

  async logout(accountId) {
    if (!accountId) {
      throw new CustomError(400, 'Refresh token is required');
    }

    await this.tokenService.removeRefreshToken(accountId);
  }

  async refreshToken(accessToken, refreshToken) {
    if (!refreshToken) {
      throw new CustomError(400, 'Refresh token is required');
    }

    this.tokenService.verifyToken(refreshToken, 'refresh');

    const accountId = await this.tokenService.getAccountIdFromToken(accessToken);

    const tokens = await this.tokenService.regenerateToken(refreshToken, accountId);

    return {accessToken: tokens.accessToken, refreshToken: tokens.refreshToken};
  }
}

module.exports = AuthService;