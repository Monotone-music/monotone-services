const CustomError = require('../utils/custom_error');

const TokenService = require('../services/token_service');
const AccountService = require('../services/account_service');

const asyncErrorHandler = require('../middleware/async_handler');

const tokenService = new TokenService();
const accountService = new AccountService();

const validateToken = asyncErrorHandler(async (req, res, next) => {
  const preFlightToken = req.header('Authorization');
  let token;
  if (!preFlightToken?.startsWith('Bearer ')) {
    throw new CustomError(401, 'Access denied. No token provided');
  } else {
    token = preFlightToken.split(' ')[1];
  }

  tokenService.verifyToken(token, 'access');
  next();
});

const validateAuthorization = (authLevel) => asyncErrorHandler(async (req, res, next) => {
  const preFlightToken = req.header('Authorization');
  let token;
  if (!preFlightToken?.startsWith('Bearer ')) {
    throw new CustomError(401, 'Access denied. No token provided');
  } else {
    token = preFlightToken.split(' ')[1];
  }

  const accountId = await tokenService.getAccountIdFromToken(token);

  const account = await accountService.getAccountById(accountId);

  if (account.accessLevel.accessLevel !== authLevel || !account.accessLevel) {
    throw new CustomError(403, 'Access denied. Insufficient permissions');
  }

  next();
});

module.exports = {validateToken, validateAuthorization};