const CustomError = require('../utils/custom_error');

/**
 * Async handler for catching errors in async functions
 * @param {Function} fn - The async function to handle
 * @returns {Function} - Middleware function
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => {
    if (err instanceof CustomError) {
      // Handle custom error
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }

    // Handle general errors
    console.error('Unexpected error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Internal Server Error',
    });
  });
};

module.exports = asyncHandler;
