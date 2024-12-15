const AuthService = require('../services/auth_service');

const asyncHandler = require('../middleware/async_handler');
const CustomError = require("../utils/custom_error");

class AuthController {
  constructor() {
    this.authService = new AuthService();
  }

  login = asyncHandler(async (req, res) => {
    const {username, password} = req.body;
    const flag = req.query.flag;
    const tokens = await this.authService.login(username, password, flag);
    res.status(200).json({status: 'ok', message: 'Login successful', data: tokens});
  });

  logout = asyncHandler(async (req, res) => {
    const accountId = req.body.accountId;
    await this.authService.logout(accountId);
    res.status(200).json({status: 'ok', message: 'Logout successful'});
  });

  refresh = asyncHandler(async (req, res) => {
    const preflightToken = req.header('Authorization')
    let accessToken;
    if (!preflightToken?.startsWith('Bearer ')) {
      throw new CustomError(401, 'Access denied. No token provided');
    } else {
      accessToken = preflightToken.split(' ')[1];
    }
    const refreshToken = req.body.refreshToken;
    const flag = req.query.flag;
    const tokens = await this.authService.refreshToken(accessToken, refreshToken, flag);
    res.status(200).json({status: 'ok', message: 'Token refreshed', data: tokens});
  });

  keepAlive = asyncHandler(async (req, res) => {
    const preflightToken = req.header('Authorization')
    let accessToken;
    if (!preflightToken?.startsWith('Bearer ')) {
      throw new CustomError('Access denied. No token provided', 401);
    } else {
      accessToken = preflightToken.split(' ')[1];
    }
    this.authService.keepAlive(accessToken);
    res.status(200).json({status: 'ok', message: 'Token still valid'});
  });

  test = asyncHandler(async (req, res) => {
    res.status(200).json({status: 'ok', message: 'Test successful'});
  });
}

module.exports = new AuthController();