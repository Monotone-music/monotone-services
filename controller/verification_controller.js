const VerificationService = require('../services/verification_services');

const asyncHandler = require('../middleware/async_handler');

class VerificationController {
  constructor() {
    this.verificationService = new VerificationService();
  }

  verifyAccount = asyncHandler(async (req, res) => {
    const token = req.query.token;

    console.log(token);
    await this.verificationService.verifyAccount(token);
    res.status(200).json({status: 'ok', message: 'Account verified'});
  });
}

module.exports = VerificationController;