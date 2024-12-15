const CustomError = require('../utils/custom_error');

const TokenService = require('../services/token_service');

const asyncErrorHandler = require('../middleware/async_handler');

const tokenService = new TokenService();

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

module.exports = {validateToken};