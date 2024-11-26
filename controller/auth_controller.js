const AuthService = require('../services/auth_service');

const asyncHandler = require('../middleware/async_handler');
const CustomError = require("../utils/custom_error");

class AuthController {
  constructor() {
    this.authService = new AuthService();
  }

  login = asyncHandler(async (req, res) => {
    const {username, password} = req.body;
    const tokens = await this.authService.login(username, password);
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
      throw new CustomError('Access denied. No token provided', 401);
    } else {
      accessToken = preflightToken.split(' ')[1];
    }
    const refreshToken = req.body.refreshToken;
    const tokens = await this.authService.refreshToken(accessToken, refreshToken);
    res.status(200).json({status: 'ok', message: 'Token refreshed', data: tokens});
  });

  test = asyncHandler(async (req, res) => {
    res.status(200).json({status: 'ok', message: 'Test successful'});
  });
}

module.exports = new AuthController();