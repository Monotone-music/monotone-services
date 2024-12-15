const ListenerService = require('../services/listener_service');
const TokenService = require('../services/token_service');

const asyncHandler = require('../middleware/async_handler');
const CustomError = require("../utils/custom_error");

class ListenerController {
  constructor() {
    this.listenerService = new ListenerService();
    this.tokenService = new TokenService();
  }

  getListenerProfile = asyncHandler(async (req, res) => {
    const preFlightToken = req.header('Authorization');
    let token;
    if (!preFlightToken?.startsWith('Bearer ')) {
      throw new CustomError(401, 'Access denied. No token provided');
    } else {
      token = preFlightToken.split(' ')[1];
    }

    const accountId = await this.tokenService.getAccountIdFromToken(token);

    const listener = await this.listenerService.getListenerByAccountId(accountId);
    res.status(200).json({status: 'ok', message: 'Listener found', data: listener});
  });
}

module.exports = new ListenerController();