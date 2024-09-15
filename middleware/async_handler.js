const logger = require('../init/logging');
const formatResponse = require('../utils/response_formatter');

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
        logger.error(`Error: ${error.message}`);
        res.status(500).json(formatResponse(500, 'An error occurred', null));
    });
};

module.exports = asyncHandler;
